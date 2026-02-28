import { tool } from "@openai/agents";
import Medicine from "../../../models/medicine.model.js";
import { z } from "zod";

export const addStockTool = tool({
  name: "add_stock",
  description:
    "Add stock quantity to a medicine using its PZN code, medicine name, or MongoDB ID. " +
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
    quantity: z.number().positive().describe("Number of units to add to the current stock"),
  }),

  execute: async ({ pzn, name, id, quantity }) => {
    if (!pzn && !name && !id) {
      return "You must provide at least one identifier: pzn, name, or id.";
    }

    // Escape special regex characters to prevent injection
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let medicine;
    if (id) {
      medicine = await Medicine.findById(id);
    } else if (pzn) {
      // Normalise: strip any "PZN-" / "PZN " prefix the agent might include
      const cleanPzn = pzn.trim().replace(/^pzn[-\s]*/i, "");
      medicine = await Medicine.findOne({ pzn: cleanPzn });
    } else if (name) {
      const cleanName = name.trim();
      // Partial, case-insensitive match — works for "Alprazolam" → "Alprazolam 0.5mg"
      medicine = await Medicine.findOne({
        name: { $regex: new RegExp(escapeRegex(cleanName), "i") },
      });
    }

    if (!medicine) {
      return `Medicine not found for "${pzn || name || id}". Check the name/PZN spelling and try again.`;
    }

    medicine.stock = (medicine.stock || 0) + quantity;
    await medicine.save();

    return `Successfully added ${quantity} units to "${medicine.name}" (PZN: ${medicine.pzn}). New stock: ${medicine.stock} units.`;
  },
});
