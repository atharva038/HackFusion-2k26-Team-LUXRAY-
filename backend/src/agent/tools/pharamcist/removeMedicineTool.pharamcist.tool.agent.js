import { tool } from "@openai/agents";
import Medicine from "../../../models/medicine.model.js";
import { z } from "zod";

export const removeMedicineTool = tool({
  name: "remove_medicine",
  description:
    "Permanently delete a medicine from the pharmacy inventory by its name, PZN code, or MongoDB ID. " +
    "Use this ONLY when the medicine needs to be removed entirely (discontinued, recalled, etc.). " +
    "Do NOT use this to reduce stock — use reduce_stock for that.",

  parameters: z.object({
    pzn: z
      .string()
      .nullable()
      .default(null)
      .describe("The PZN code of the medicine. Pass null if not available."),
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
    reason: z
      .string()
      .optional()
      .default("Removed by pharmacist")
      .describe("Reason for removing the medicine (for audit log)"),
  }),

  execute: async ({ pzn, name, id, reason }) => {
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
      medicine = await Medicine.findOne({
        name: { $regex: new RegExp(escapeRegex(name.trim()), "i") },
      });
    }

    if (!medicine) {
      return `Medicine not found for "${pzn || name || id}". Check the name/PZN spelling and try again.`;
    }

    const snapshot = { name: medicine.name, pzn: medicine.pzn, stock: medicine.stock };
    await Medicine.findByIdAndDelete(medicine._id);

    return (
      `✅ Medicine successfully removed from inventory.\n` +
      `Name: ${snapshot.name}\n` +
      `PZN: ${snapshot.pzn}\n` +
      `Stock at removal: ${snapshot.stock} units\n` +
      `Reason: ${reason}`
    );
  },
});
