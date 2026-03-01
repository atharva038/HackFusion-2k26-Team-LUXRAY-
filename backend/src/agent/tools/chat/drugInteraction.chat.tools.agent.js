import { tool } from "@openai/agents";
import { z } from "zod";

// ── FDA field keys that contain interaction data ───────────────────────────
const INTERACTION_FIELDS = [
  "drug_interactions",
  "warnings",
  "warnings_and_cautions",
  "contraindications",
];

const FDA_API_TIMEOUT_MS = 6000;
const MAX_SECTION_LENGTH = 800;
const MAX_DETAIL_LENGTH = 300;

/**
 * Fetch drug label data from OpenFDA for a given medicine name.
 * Returns the raw label object or null if not found.
 */
async function fetchFdaLabel(medicineName) {
  const name = encodeURIComponent(medicineName.trim());
  const searches = [
    `openfda.brand_name:"${name}"`,
    `openfda.generic_name:"${name}"`,
    `openfda.substance_name:"${name}"`,
  ];

  for (const search of searches) {
    try {
      const url = `https://api.fda.gov/drug/label.json?search=${search}&limit=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(FDA_API_TIMEOUT_MS) });
      if (!res.ok) continue;
      const data = await res.json();
      const label = data?.results?.[0];
      if (label) return label;
    } catch {
      // try next search variant
    }
  }
  return null;
}

/**
 * Extract interaction-related text sections from an FDA label.
 */
function extractInteractionText(label) {
  const sections = {};
  for (const field of INTERACTION_FIELDS) {
    const val = label[field];
    if (val) {
      const text = Array.isArray(val) ? val.join(" ") : String(val);
      sections[field] = text.slice(0, MAX_SECTION_LENGTH).trim();
    }
  }
  return sections;
}

/**
 * Check whether any section text mentions a given drug name (case-insensitive).
 */
function mentionsDrug(sectionText, drugName) {
  return sectionText.toLowerCase().includes(drugName.toLowerCase());
}

export const checkDrugInteractions = tool({
  name: "check_drug_interactions",
  description:
    "Check for potential drug-drug interactions between two or more medicines. " +
    "Uses the OpenFDA drug label database to look up interaction warnings, contraindications, " +
    "and cautions. Call this when a user asks whether medicines are safe to take together, " +
    "or mentions they are already taking another medicine.",

  parameters: z.object({
    medicines: z
      .array(z.string())
      .min(2)
      .describe(
        "List of medicine names to check for interactions. Provide at least two names."
      ),
  }),

  execute: async ({ medicines }) => {
    try {
      const cleanedNames = medicines.map((m) => m.trim()).filter(Boolean);
      if (cleanedNames.length < 2) {
        return { error: "Please provide at least two medicine names to check interactions." };
      }

      // Fetch FDA labels in parallel
      const labels = await Promise.all(
        cleanedNames.map(async (name) => ({
          name,
          label: await fetchFdaLabel(name),
        }))
      );

      const interactions = [];
      const notFound = [];

      for (const { name, label } of labels) {
        if (!label) {
          notFound.push(name);
          continue;
        }

        const sections = extractInteractionText(label);
        if (Object.keys(sections).length === 0) continue;

        // Check if this drug's label mentions any of the other drugs
        const others = cleanedNames.filter(
          (n) => n.toLowerCase() !== name.toLowerCase()
        );

        for (const other of others) {
          for (const [field, text] of Object.entries(sections)) {
            if (mentionsDrug(text, other)) {
              interactions.push({
                drug: name,
                interactsWith: other,
                severity: field === "contraindications" ? "HIGH" : "MODERATE",
                source: field.replace(/_/g, " "),
                detail: text.slice(0, MAX_DETAIL_LENGTH),
              });
            }
          }
        }
      }

      // De-duplicate symmetric pairs (A→B and B→A)
      const seen = new Set();
      const uniqueInteractions = interactions.filter((i) => {
        const key = [i.drug, i.interactsWith].sort().join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return {
        checkedMedicines: cleanedNames,
        interactions: uniqueInteractions,
        notFound,
        interactionCount: uniqueInteractions.length,
        summary:
          uniqueInteractions.length > 0
            ? `Found ${uniqueInteractions.length} potential interaction(s) between the provided medicines.`
            : "No explicit interaction warnings found between these medicines in the FDA database.",
        disclaimer:
          "This check uses the OpenFDA label database and may not be exhaustive. Always advise the user to consult their pharmacist or doctor before combining medicines.",
      };
    } catch (error) {
      return { error: error.message };
    }
  },
});
