import { tool } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";
import { addTransaction } from "../../service/addTxn.service.agent.js";
import { reduceQuantity } from "../../service/reduceQuantity.service.js";

export const order = tool({
  name: "order_medicine",
  description:
    "Place a medicine order using MongoDB. Checks stock, reduces inventory, and records the transaction.",

  parameters: z.object({
    patientId: z.string(),
    age: z.number(),
    gender: z.string(),
    productName: z.string(),
    quantity: z.number().min(1),
    dosageFrequency: z.string(),
    prescriptionRequired: z.string(),
  }),

  execute: async ({
    patientId,
    age,
    gender,
    productName,
    quantity,
    dosageFrequency,
    prescriptionRequired,
  }) => {
    try {
      // Convert prescription string to boolean
      const prescriptionFlag = prescriptionRequired.toLowerCase() === "yes";

      // 1. Find medicine from MongoDB
      const medicine = await Medicine.findOne({
        name: { $regex: productName, $options: "i" },
      });

      if (!medicine) {
        return "❌ Medicine not found.";
      }

      // 2. Check stock
      if (medicine.stock < quantity) {
        return `❌ Insufficient stock. Available: ${medicine.stock}`;
      }

      // 3. Reduce stock
      const updateResult = await reduceQuantity({
        medicineId: medicine._id.toString(),
        quantity,
      });

      if (updateResult.error) {
        return `❌ ${updateResult.error}`;
      }

      // 4. Calculate price
      const totalPrice = medicine.price * quantity;

      // 5. Save order
      await addTransaction({
        patientId,
        age,
        gender,
        purchaseDate: new Date(),
        productName: medicine.name,
        quantity,
        totalPrice,
        dosageFrequency,
        prescriptionRequired: prescriptionFlag,
      });

      return `✅ Order placed successfully

Medicine: ${medicine.name}
Quantity: ${quantity}
Total Price: €${totalPrice}
Remaining Stock: ${updateResult.remainingStock}`;
    } catch (error) {
      return `❌ ${error.message}`;
    }
  },
});
