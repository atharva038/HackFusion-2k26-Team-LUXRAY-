import { tool } from "@openai/agents";
import Medicine from "../../../models/medicine.model.js";
import { z } from "zod";

export const addStockTool = tool({
  name: "add_stock",
  description: "Add stock quantity using PZN, medicine name, or MongoDB ID",

  parameters: z.object({
    pzn: z.string().describe("The PZN number").optional(), // keep optional, but we’ll require it manually below
    name: z.string().describe("The medicine name").optional(),
    id: z.string().describe("The MongoDB ID").optional(),
    quantity: z.number().positive().describe("Units to add"),
  }),

  async func({ pzn, name, id, quantity }) {
    // Ensure at least one identifier exists
    if (!pzn && !name && !id) {
      return "You must provide at least one of: pzn, name, or id";
    }

    let medicine;
    if (id) {
      medicine = await Medicine.findById(id);
    } else if (pzn) {
      medicine = await Medicine.findOne({ pzn });
    } else if (name) {
      medicine = await Medicine.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    }

    if (!medicine) return `Medicine not found for "${pzn || name || id}"`;

    medicine.stock = (medicine.stock || 0) + quantity;
    await medicine.save();

    return `Successfully added ${quantity} units to ${medicine.name}. New stock: ${medicine.stock}`;
  },
});