import { tool } from "@openai/agents";
import Medicine from "../../../models/medicine.model.js";
import { z } from "zod";

export const reduceStockTool = tool({
  name: "reduce_stock",
  description:
    "Reduce (deduct) stock quantity from a medicine using its PZN code, medicine name, or MongoDB ID. " +
    "Use this for dispensing, removing damaged stock, or correcting inventory. " +
    "Provide exactly one identifier; set the others to null.",

  parameters: z.object({
    pzn: z
      .string()
      .nullable()
      .default(null)
      .describe("The PZN (Pharmazentralnummer) code. Pass null if not available."),
    name: z
      .string()
      .nullable()
      .default(null)
      .describe("The medicine name. Pass null if not available."),
    id: z
      .string()
      .nullable()
      .default(null)
      .describe("The MongoDB ObjectId of the medicine. Pass null if not available."),
    quantity: z
      .number()
      .positive()
      .describe("Number of units to deduct from the current stock"),
    reason: z
      .string()
      .nullable()
      .default(null)
      .describe("Optional reason for stock reduction (e.g., 'dispensed', 'damaged', 'expired', 'correction')"),
  }),

  execute: async ({ pzn, name, id, quantity, reason }) => {
    if (!pzn && !name && !id) {
      return "You must provide at least one identifier: pzn, name, or id.";
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let medicine;
    if (id) {
      medicine = await Medicine.findById(id);
    } else if (pzn) {
      const cleanPzn = pzn.trim().replace(/^pzn[-\s]*/i, "");
      medicine = await Medicine.findOne({ pzn: cleanPzn });
    } else if (name) {
      const cleanName = name.trim();
      medicine = await Medicine.findOne({
        name: { $regex: new RegExp(escapeRegex(cleanName), "i") },
      });
    }

    if (!medicine) {
      return `Medicine not found for "${pzn || name || id}". Check the name/PZN spelling and try again.`;
    }

    const currentStock = medicine.stock || 0;

    if (quantity > currentStock) {
      return (
        `Cannot reduce stock: requested ${quantity} units but only ${currentStock} units available ` +
        `for "${medicine.name}" (PZN: ${medicine.pzn}). Reduction denied to prevent negative stock.`
      );
    }

    medicine.stock = currentStock - quantity;
    await medicine.save();

    const reasonNote = reason ? ` Reason: ${reason}.` : "";
    return (
      `Successfully reduced stock of "${medicine.name}" (PZN: ${medicine.pzn}) by ${quantity} units.` +
      ` Previous stock: ${currentStock}, New stock: ${medicine.stock} units.${reasonNote}`
    );
  },
});
