import { tool } from "@openai/agents";
import { z } from "zod";
import mongoose from "mongoose";
import Medicine from "../../../models/medicine.model.js";

export const checkStock = tool({
  name: "check_medicine_details",
  description:
    "Get medicine details and stock using medicine name, MongoDB id, or PZN. " +
    "Provide exactly one identifier; set the others to null.",

  parameters: z.object({
    medicineName: z
      .string()
      .nullable()
      .default(null)
      .describe("Medicine name to search by. Pass null if using id or pzn."),
    id: z
      .string()
      .nullable()
      .default(null)
      .describe("MongoDB ObjectId of the medicine. Pass null if using name or pzn."),
    pzn: z
      .string()
      .nullable()
      .default(null)
      .describe("PZN code of the medicine. Pass null if using name or id."),
  }),

  execute: async ({ medicineName, id, pzn }) => {
    try {
      // Normalise: treat null/undefined as empty string for trim safety
      const name = (medicineName || "").trim();
      const medId = (id || "").trim();
      const medPzn = (pzn || "").trim();

      if (!name && !medId && !medPzn) {
        return { error: "Provide at least one of: medicineName, id, or pzn." };
      }

      let query = {};

      // Priority: id > pzn > name
      if (medId) {
        if (!mongoose.Types.ObjectId.isValid(medId)) {
          return { error: "Invalid MongoDB id" };
        }
        query._id = new mongoose.Types.ObjectId(medId);
      } else if (medPzn) {
        query.pzn = medPzn;
      } else {
        query.name = { $regex: name, $options: "i" };
      }

      const medicine = await Medicine.findOne(query).lean();
      if (!medicine) {
        return { error: "Medicine not found" };
      }

      return {
        id: medicine._id.toString(),
        name: medicine.name,
        pzn: medicine.pzn,
        price: medicine.price,
        quantity: medicine.stock,
        status: medicine.stock > 0 ? "In Stock" : "Out of Stock",
        prescriptionRequired: medicine.prescriptionRequired,
      };
    } catch (error) {
      return { error: error.message };
    }
  },
});
