import { tool } from "@openai/agents";
import Medicine from "../../../models/medicine.model.js";
import { z } from "zod";

export const addMedicineTool = tool({
  name: "add_new_medicine",
  description:
    "Add a brand-new medicine to the pharmacy inventory. Use this when the medicine does NOT exist yet. " +
    "Requires: name, PZN code, price, initial stock, and unit type. " +
    "Do NOT use this to restock an existing medicine — use add_stock for that.",

  parameters: z.object({
    name: z.string().describe("Full name of the medicine, e.g. 'Paracetamol 500mg'"),
    pzn: z.string().describe("Unique PZN (Pharmazentralnummer) code for the medicine"),
    price: z.number().positive().describe("Price per unit in ₹ (Indian Rupees)"),
    stock: z.number().int().nonnegative().describe("Initial stock quantity to add"),
    unitType: z
      .enum(["tablet", "strip", "bottle", "injection", "tube", "box", "capsule"])
      .describe("Unit type for this medicine"),
    description: z
      .string()
      .optional()
      .default("")
      .describe("Short description of the medicine (optional)"),
    prescriptionRequired: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether a prescription is required to purchase this medicine"),
    lowStockThreshold: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .default(10)
      .describe("Stock level below which a low-stock alert should be triggered"),
  }),

  execute: async ({ name, pzn, price, stock, unitType, description, prescriptionRequired, lowStockThreshold }) => {
    // Check PZN uniqueness
    const existing = await Medicine.findOne({ pzn: pzn.trim() });
    if (existing) {
      return `❌ A medicine with PZN "${pzn}" already exists: "${existing.name}". Use add_stock to restock it instead.`;
    }

    // Check name uniqueness (case-insensitive)
    const sameName = await Medicine.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (sameName) {
      return `❌ A medicine named "${sameName.name}" already exists (PZN: ${sameName.pzn}). Use add_stock to restock it instead.`;
    }

    const medicine = await Medicine.create({
      name: name.trim(),
      pzn: pzn.trim(),
      price,
      stock,
      unitType,
      description: description || "",
      prescriptionRequired: prescriptionRequired ?? false,
      lowStockThreshold: lowStockThreshold ?? 10,
    });

    return (
      `✅ New medicine added successfully!\n` +
      `Name: ${medicine.name}\n` +
      `PZN: ${medicine.pzn}\n` +
      `Price: ₹${medicine.price}\n` +
      `Stock: ${medicine.stock} ${medicine.unitType}(s)\n` +
      `Rx Required: ${medicine.prescriptionRequired ? "Yes" : "No"}\n` +
      `Low Stock Alert: ≤ ${medicine.lowStockThreshold} units\n` +
      `ID: ${medicine._id}`
    );
  },
});
