import { tool } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";

export const describeMed = tool({
  name: "describe_medicine",
  description:
    "Takes a medicine name and returns its description in any language",

  parameters: z.object({
    medicineName: z.string().describe("Medicine name to describe"),
  }),

  execute: async ({ medicineName }) => {
    try {
      const nameQuery = medicineName.trim();

      if (!nameQuery) {
        return { description: "Please provide a medicine name." };
      }

      // Case-insensitive search
      const medicine = await Medicine.findOne({
        name: { $regex: nameQuery, $options: "i" },
      }).lean();

      if (!medicine) {
        return {
          description: "Medicine not found.",
        };
      }

      return {
        description:
          medicine.description || "No description available.",
      };
    } catch (error) {
      return {
        description: "Error fetching medicine description.",
        error: error.message,
      };
    }
  },
});