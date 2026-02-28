import { tool, Agent, run } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";
import { addTransaction } from "../../service/addTxn.service.agent.js";
import User from "../../../models/user.model.js";
import Order from "../../../models/order.model.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "test",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "test",
});

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
  return similarity >= 0.7; // 70% match
}

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
    "Place a medicine order using MongoDB and immediately generate a Razorpay payment link. " +
    "Checks stock availability and records the transaction. Stock is deducted when the pharmacist dispatches the order. " +
    "IMPORTANT: If the medicine requires a prescription and no prescriptionProof is provided, the order is BLOCKED. " +
    "You must call check_prescription_on_file first to obtain a prescriptionProof ID, then retry this tool with that ID.",

  parameters: z.object({
    patientId: z.string(),
    age: z.number().describe("The age of the patient in years"),
    gender: z.string().describe("The gender of the patient"),
    items: z.array(z.object({
      productName: z.string(),
      quantity: z.number().min(1),
      dosageFrequency: z.string(),
    })).describe("List of medicines to order"),
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
    items,
    prescriptionProof = "",
  }) => {
    try {
      const processedItems = [];
      let totalOrderPrice = 0;
      let blocks = [];
      let user = null;
      try {
        user = await User.findById(patientId).select("allergies");
      } catch (e) { }

      for (const item of items) {
        const { productName, quantity, dosageFrequency } = item;

        // 1. Find medicine from MongoDB
        // First try exact regex match
        let medicine = await Medicine.findOne({
          name: { $regex: productName, $options: "i" },
        });

        if (!medicine) {
          // Fallback: fetch all and fuzzy match
          // Extract the base medicine name (e.g. "Amlodipine 5 mg" -> "Amlodipine")
          const baseName = productName.split(" ")[0];

          let possibleMatches = await Medicine.find({
            name: { $regex: baseName, $options: "i" }
          });

          if (possibleMatches.length > 0) {
            medicine = possibleMatches[0];
          } else {
            // Last resort: complete fuzzy match on all medicines
            const allMedicines = await Medicine.find({});
            for (const med of allMedicines) {
              if (isFuzzyMatch(med.name, productName)) {
                medicine = med;
                break;
              }
            }
          }
        }

        if (!medicine) {
          blocks.push(`❌ Medicine "${productName}" not found.`);
          continue;
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
          blocks.push(`❌ Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`);
          continue;
        }

        // 4. Calculate price
        const itemPrice = medicine.price * quantity;
        totalOrderPrice += itemPrice;

        processedItems.push({
          medicineId: medicine._id.toString(),
          medicineName: medicine.name,
          quantity,
          dosageFrequency,
          totalPrice: itemPrice,
          prescriptionRequired: prescriptionFlag,
          prescriptionProof
        });
      }

      if (blocks.length > 0 && processedItems.length === 0) {
        return blocks.join("\n");
      }

      // 5. Save order
      const result = await addTransaction({
        patientId,
        items: processedItems,
        age,
        gender,
        purchaseDate: new Date(),
      });

      if (result.error) {
        return `❌ ${result.error}`;
      }

      // 6. Automatically Generate Razorpay Payment Link
      let razorpayOrderId = "N/A";
      try {
        const dbOrder = await Order.findById(result.orderId);
        if (dbOrder && dbOrder.status === "awaiting_payment") {
          const amountInPaise = Math.round(dbOrder.totalAmount * 100);
          const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_order_${dbOrder._id}`,
          };
          const razorpayOrder = await razorpay.orders.create(options);
          dbOrder.razorpayOrderId = razorpayOrder.id;
          await dbOrder.save();
          razorpayOrderId = razorpayOrder.id;
        }
      } catch (paymentErr) {
        console.error("Razorpay generation failed during order_medicine:", paymentErr);
        return `✅ Order placed in DB but payment generation failed. 
Order ID: ${result.orderId}
Error: ${paymentErr.message}`;
      }

      const itemsList = processedItems.map(i => `${i.medicineName} (x${i.quantity})`).join(", ");

      return `✅ Order placed successfully
      
Order ID: ${result.orderId}
Items: ${itemsList}
Total Price: ₹${totalOrderPrice}
Status: ${result.status}
Razorpay ID: ${razorpayOrderId}`;
    } catch (error) {
      return `❌ ${error.message}`;
    }
  },
});
