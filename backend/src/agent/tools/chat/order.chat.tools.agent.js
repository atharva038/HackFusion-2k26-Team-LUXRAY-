import { tool } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";
import { addTransaction } from "../../service/addTxn.service.agent.js";

export const order = tool({
  name: "order_medicine",
  description:
    "Place a medicine order using MongoDB. Checks stock availability and records the transaction. Stock is deducted when the pharmacist dispatches the order.",

  parameters: z.object({
    patientId: z.string(),
    age: z.number().describe('The age of the patient in years'),
    gender: z.string().describe('The gender of the patient'),
    productName: z.string(),
    quantity: z.number().min(1),
    dosageFrequency: z.string(),
  }),

  execute: async ({
    patientId,
    age,
    gender,
    productName,
    quantity,
    dosageFrequency,
  }) => {
    try {
      // 1. Find medicine from MongoDB
      const medicine = await Medicine.findOne({
        name: { $regex: productName, $options: "i" },
      });

      if (!medicine) {
        return "❌ Medicine not found.";
      }

      // Check if prescription is required from the DB (no guessing by LLM)
      const prescriptionFlag = medicine.prescriptionRequired || false;

      // 2. Check stock availability (do NOT deduct here — stock is deducted at dispatch by admin)
      if (medicine.stock < quantity) {
        return `❌ Insufficient stock. Available: ${medicine.stock}`;
      }

      // 3. Calculate price
      const totalPrice = medicine.price * quantity;

      // 4. Save order with ObjectId reference to the medicine
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
