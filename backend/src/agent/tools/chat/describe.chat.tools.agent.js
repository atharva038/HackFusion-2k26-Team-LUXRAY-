import { tool } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";

// ── FDA field priority list ────────────────────────────────────────────────
const FDA_FIELDS = [
  { key: "indications_and_usage", label: "Uses / Indications" },
  { key: "dosage_and_administration", label: "Dosage & Administration" },
  { key: "adverse_reactions", label: "Side Effects" },
  { key: "warnings", label: "Warnings" },
  { key: "warnings_and_cautions", label: "Warnings & Cautions" },
  { key: "contraindications", label: "Contraindications" },
  { key: "drug_interactions", label: "Drug Interactions" },
  { key: "description", label: "Clinical Description" },
];

/**
 * Query the OpenFDA drug label endpoint for a given medicine name.
 * Returns a structured object with the most useful clinical fields.
 */
async function fetchFdaInfo(medicineName) {
  const name = encodeURIComponent(medicineName.trim());
  const searches = [
    `openfda.brand_name:"${name}"`,
    `openfda.generic_name:"${name}"`,
    `openfda.substance_name:"${name}"`,
  ];

  const promises = searches.map(async (search) => {
    const url = `https://api.fda.gov/drug/label.json?search=${search}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Not found or API error");
    const data = await res.json();
    const label = data?.results?.[0];
    if (!label) throw new Error("No results array");

    const extracted = {};
    for (const { key, label: fieldLabel } of FDA_FIELDS) {
      const val = label[key];
      if (val) {
        const text = Array.isArray(val) ? val.join(" ") : String(val);
        extracted[fieldLabel] = text.slice(0, 600).trim();
      }
    }

    if (Object.keys(extracted).length === 0) throw new Error("No relevant fields");
    return { found: true, source: "OpenFDA", data: extracted };
  });

  try {
    return await Promise.any(promises);
  } catch (aggregateErr) {
    return { found: false };
  }
}

export const describeMed = tool({
  name: "describe_medicine",
  description:
    "Returns rich clinical information about a medicine: local DB description PLUS live FDA data " +
    "(uses/indications, dosage, side effects, warnings, contraindications, drug interactions). " +
    "Use this whenever the user asks about a medicine, its purpose, how to use it, side effects, " +
    "or when making a recommendation — always enrich your response with the FDA data returned.",

  parameters: z.object({
    medicineName: z.string().describe("Medicine name to look up"),
  }),

  execute: async ({ medicineName }) => {
    try {
      const nameQuery = medicineName.trim();
      if (!nameQuery) return { description: "Please provide a medicine name." };

      // Run DB lookup and FDA enrichment in true parallel to minimize latency
      const [medicine, fdaInfo] = await Promise.all([
        Medicine.findOne({ name: { $regex: nameQuery, $options: "i" } }).lean(),
        fetchFdaInfo(nameQuery)
      ]);

      const localDescription = medicine?.description || null;
      const localMeta = medicine
        ? {
            price: medicine.price,
            stock: medicine.stock,
            unitType: medicine.unitType,
            prescriptionRequired: medicine.prescriptionRequired,
          }
        : null;

      return {
        name: medicine?.name || nameQuery,
        localDescription,
        pharmacyInfo: localMeta,
        fdaData: fdaInfo.found
          ? fdaInfo.data
          : null,
        fdaSource: fdaInfo.found ? "OpenFDA Drug Label Database" : null,
        note: fdaInfo.found
          ? "Use the fdaData fields to give the user a comprehensive, clinically accurate response."
          : "No FDA label found — rely on your own pharmacological knowledge to supplement the local description.",
      };
    } catch (error) {
      return { error: error.message };
    }
  },
});