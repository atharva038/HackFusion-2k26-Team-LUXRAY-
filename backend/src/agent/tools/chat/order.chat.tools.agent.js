import { tool, Agent, run } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";
import { addTransaction } from "../../service/addTxn.service.agent.js";
import User from "../../../models/user.model.js";

/**
 * A minimal single-purpose Agent that acts as a clinical pharmacist.
 * It reads the FDA warning text + the user's allergens and returns a JSON
 * object listing any logical allergy conflicts (including indirect ones).
 */
const allergyCheckerAgent = new Agent({
  name: "allergy_safety_checker",
  instructions:
    "You are a clinical pharmacist safety assistant with full pharmacological knowledge. " +
    "When given a medicine name and a patient's allergy list, you must logically determine whether " +
    "any allergen conflicts with the medicine — using BOTH the provided FDA label text (if any) AND " +
    "your own medical knowledge. " +
    "IMPORTANT: Apply international name equivalences automatically. For example: " +
    "'paracetamol' and 'acetaminophen' are the same drug; " +
    "'amoxicillin' is a penicillin-class antibiotic; " +
    "'ibuprofen' is an NSAID related to aspirin sensitivity. " +
    "Even if the FDA label text is empty or missing, use your own pharmacological knowledge to detect conflicts. " +
    "Respond ONLY with a valid JSON object in this exact shape, no markdown, no explanation:\n" +
    '{\n  \"conflicts\": [\n    { \"allergen\": \"<name>\", \"reason\": \"<short clinical reason>\" }\n  ]\n}\n' +
    "If there are no conflicts, return: { \"conflicts\": [] }",
});

/**
 * Uses GPT to logically determine whether any of the user's known allergens
 * conflict with the FDA drug label warnings for a given medicine.
 *
 * Returns an array of objects: { allergen, reason } for each conflict found,
 * or an empty array if the medicine is safe for this patient.
 */
async function checkAllergyConflictWithLLM(medicineName, fdaWarningText, allergens) {
  const allergenList = allergens
    .map((a) => `- ${a.allergen} (severity: ${a.severity}${a.reaction ? `, known reaction: ${a.reaction}` : "}"}`)
    .join("\n");

  const fdaSection = fdaWarningText
    ? `Below is the official FDA drug label warning text for "${medicineName}":\n---\n${fdaWarningText.slice(0, 3000)}\n---\n\n`
    : `No FDA label text was found for "${medicineName}" — use your own pharmacological knowledge to determine any conflicts (e.g. paracetamol = acetaminophen, amoxicillin is a penicillin-class drug, etc.).\n\n`;

  const prompt = `You are a clinical pharmacist safety assistant.

A patient wants to order the medicine: "${medicineName}".

The patient has the following known allergies:
${allergenList}

${fdaSection}Task:
Logically determine whether any of the patient's allergens conflict with this medicine — including direct conflicts, indirect drug-class conflicts, and international name equivalences (paracetamol = acetaminophen, etc.).

Respond ONLY with a valid JSON object in this exact shape (no markdown, no explanation):
{
  "conflicts": [
    { "allergen": "<allergen name>", "reason": "<short clinical reason>" }
  ]
}

If there are no conflicts, return: { "conflicts": [] }`;

  const result = await run(allergyCheckerAgent, prompt);
  const raw = result.finalOutput ?? '{"conflicts":[]}';
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.conflicts) ? parsed.conflicts : [];
}

export const order = tool({
  name: "order_medicine",
  description:
    "Place a medicine order using MongoDB. Checks stock availability and records the transaction. Stock is deducted when the pharmacist dispatches the order. " +
    "IMPORTANT: If the medicine requires a prescription and no prescriptionProof is provided, the order is BLOCKED. " +
    "You must call check_prescription_on_file first to obtain a prescriptionProof ID, then retry this tool with that ID.",

  parameters: z.object({
    patientId: z.string(),
    age: z.number().describe("The age of the patient in years"),
    gender: z.string().describe("The gender of the patient"),
    productName: z.string(),
    quantity: z.number().min(1),
    dosageFrequency: z.string(),
    prescriptionProof: z
      .string()
      .describe(
        "Prescription record ID returned by check_prescription_on_file. Pass empty string for OTC medicines. REQUIRED (with actual ID) for prescription medicines — call check_prescription_on_file first to obtain it."
      ),
  }),

  execute: async ({
    patientId,
    age,
    gender,
    productName,
    quantity,
    dosageFrequency,
    prescriptionProof = "",
  }) => {
    try {
      // 1. Find medicine from MongoDB
      const medicine = await Medicine.findOne({
        name: { $regex: productName, $options: "i" },
      });

      if (!medicine) {
        return "❌ Medicine not found.";
      }

      const prescriptionFlag = medicine.prescriptionRequired || false;

      // 2. PRESCRIPTION GATE — never allow a controlled medicine without validated proof
      if (prescriptionFlag && !prescriptionProof) {
        return JSON.stringify({
          blocked: true,
          prescriptionRequired: true,
          medicine: medicine.name,
          message:
            `⚠️ "${medicine.name}" requires a valid prescription. ` +
            `Call check_prescription_on_file with the patient's patientId and medicineName to check their record. ` +
            `If a prescription is found, retry order_medicine with the returned prescriptionId as prescriptionProof. ` +
            `If not found, ask the user to upload their prescription using the upload button, then check again after they confirm.`,
        });
      }

      // 2.5. FDA ALLERGY SAFETY GATE
      // Fetch the patient's stored allergies and compare against FDA drug label warnings.
      try {
        const user = await User.findById(patientId).select("allergies");

        if (user && user.allergies && user.allergies.length > 0) {
          // Try brand name first, then generic name as fallback
          let warningText = "";
          for (const searchField of ["openfda.brand_name", "openfda.generic_name"]) {
            const fdaUrl = `https://api.fda.gov/drug/label.json?search=${searchField}:"${encodeURIComponent(medicine.name)}"&limit=1`;
            try {
              const fdaResponse = await fetch(fdaUrl);
              if (fdaResponse.ok) {
                const fdaData = await fdaResponse.json();
                const labelResult = fdaData?.results?.[0];
                if (labelResult) {
                  const warningFields = [
                    "warnings",
                    "warnings_and_cautions",
                    "contraindications",
                    "stop_use",
                    "do_not_use",
                  ];
                  warningText = warningFields
                    .flatMap((field) =>
                      Array.isArray(labelResult[field])
                        ? labelResult[field]
                        : labelResult[field]
                        ? [labelResult[field]]
                        : []
                    )
                    .join(" ")
                    .toLowerCase();
                  break; // found a label — stop trying other fields
                }
              }
            } catch {
              // ignore per-field fetch errors and try next
            }
          }

          // Always run LLM check — FDA text is additive context;
          // if no label was found, the agent uses its own pharmacological knowledge.
          const conflicts = await checkAllergyConflictWithLLM(
            medicine.name,
            warningText,
            user.allergies
          );

          if (conflicts.length > 0) {
            const conflictLines = conflicts
              .map((c) => `• ${c.allergen}: ${c.reason}`)
              .join("\n");

            return JSON.stringify({
              blocked: true,
              allergyConflict: true,
              medicine: medicine.name,
              conflictingAllergens: conflicts.map((c) => c.allergen),
              message:
                `🚫 Order BLOCKED — Allergy Risk Detected.\n\n` +
                `"${medicine.name}" is unsafe for you based on your registered allergies:\n` +
                `${conflictLines}\n\n` +
                `Please consult your doctor or pharmacist before proceeding. ` +
                `Your safety is our priority.`,
            });
          }
        }
      } catch (allergyCheckError) {
        // Non-fatal: log but do not block the order if the allergy check itself errors
        console.warn(
          "[AllergyGate] FDA allergy check failed, proceeding with order:",
          allergyCheckError.message
        );
      }

      // 3. Check stock availability (stock is deducted at dispatch by admin, not here)
      if (medicine.stock < quantity) {
        return `❌ Insufficient stock. Available: ${medicine.stock}`;
      }

      // 4. Calculate price
      const totalPrice = medicine.price * quantity;

      // 5. Save order
      const result = await addTransaction({
        patientId,
        medicineId: medicine._id.toString(),
        age,
        gender,
        purchaseDate: new Date(),
        quantity,
        totalPrice,
        dosageFrequency,
        prescriptionRequired: prescriptionFlag,
        prescriptionProof,
      });

      if (result.error) {
        return `❌ ${result.error}`;
      }

      return `✅ Order placed successfully

Medicine: ${medicine.name}
Quantity: ${quantity}
Total Price: €${totalPrice}
Status: ${result.status}`;
    } catch (error) {
      return `❌ ${error.message}`;
    }
  },
});
