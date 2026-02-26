import { tool } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";
import { addTransaction } from "../../service/addTxn.service.agent.js";

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
