import { tool } from "@openai/agents";
import { z } from "zod";
import Prescription from "../../../models/prescription.model.js";

/**
 * Levenshtein distance for fuzzy medicine name matching.
 */
function levenshteinDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function isFuzzyMatch(a, b) {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na.includes(nb) || nb.includes(na)) return true;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return true;
  const similarity = 1 - levenshteinDistance(na, nb) / maxLen;
  return similarity >= 0.7;
}

/**
 * Tool: check_prescription_on_file
 *
 * Checks if the authenticated user has a valid, approved prescription on file
 * that covers the requested medicine (using fuzzy name matching).
 *
 * Returns prescription details including prescriptionId if found — this ID
 * should be forwarded to order_medicine as prescriptionProof.
 */
export const checkPrescriptionOnFile = tool({
  name: "check_prescription_on_file",
  description:
    "Checks if the user has a valid, approved prescription on file for the requested medicine. Returns prescriptionId if found — pass it as prescriptionProof when placing the order.",
  parameters: z.object({
    patientId: z.string().describe("The patient's MongoDB ObjectId from [SYSTEM CONTEXT]"),
    medicineName: z.string().describe("The name of the medicine the user wants to order"),
  }),
  execute: async ({ patientId, medicineName }) => {
    try {
      const record = await Prescription.findOne({ user: patientId });

      if (!record) {
        return {
          found: false,
          message:
            "No prescription record found on file. Please upload your prescription using the upload button in the interface.",
        };
      }

      if (!record.approved) {
        return {
          found: false,
          message:
            "Your uploaded prescription is still pending pharmacist review. Please wait for approval or contact the pharmacy.",
        };
      }

      if (record.validUntil && record.validUntil < new Date()) {
        return {
          found: false,
          message:
            "Your prescription on file has expired. Please upload a new, valid prescription.",
        };
      }

      // Search through all sub-prescriptions for a matching medicine
      for (const prescription of record.prescriptions) {
        if (!prescription.isActive) continue;

        for (const med of prescription.extractedData) {
          if (isFuzzyMatch(med.medi_name || "", medicineName)) {
            return {
              found: true,
              prescriptionId: record._id.toString(),
              medicine: med.medi_name,
              dosage: med.dosage,
              frequency: med.frequency,
              doctorName: med.doctor_name,
              hospitalName: med.hospital_name,
              validUntil: record.validUntil,
              message: `Valid prescription found: ${med.medi_name} prescribed by Dr. ${med.doctor_name}. Proceed with the order using this prescriptionProof.`,
            };
          }
        }
      }

      return {
        found: false,
        message: `No approved prescription found for "${medicineName}". Please upload a prescription that includes this medicine, then inform me once you have done so.`,
      };
    } catch (error) {
      return {
        found: false,
        message: `Error checking prescription record: ${error.message}`,
      };
    }
  },
});
