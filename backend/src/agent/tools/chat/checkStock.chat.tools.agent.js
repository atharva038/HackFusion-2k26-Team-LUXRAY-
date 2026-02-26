import { tool } from "@openai/agents";
import { z } from "zod";
import mongoose from "mongoose";
import Medicine from "../../../models/medicine.model.js";

export const checkStock = tool({
  name: "check_medicine_details",
  description:
    "Get medicine details and stock using medicine name, MongoDB id, or PZN",

  parameters: z
    .object({
      medicineName: z.string().optional().default(""),
      id: z.string().optional().default(""),
      pzn: z.string().optional().default(""),
    })
    .strict(),

  execute: async ({ medicineName = "", id = "", pzn = "" }) => {
    try {
      // Clean inputs
      medicineName = medicineName.trim();
      id = id.trim();
      pzn = pzn.trim();

      if (!medicineName && !id && !pzn) {
        return { error: "Provide medicineName or id or pzn" };
      }

      let query = {};

      // Priority: id > pzn > name
      if (id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return { error: "Invalid MongoDB id" };
        }
        query._id = new mongoose.Types.ObjectId(id);
      } else if (pzn) {
        query.pzn = pzn;
      } else if (medicineName) {
        query.name = { $regex: medicineName, $options: "i" };
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
