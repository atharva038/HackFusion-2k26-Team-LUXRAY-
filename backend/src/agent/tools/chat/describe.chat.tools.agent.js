import { tool } from "@openai/agents";
import { z } from "zod";
import { loadProducts } from "../../service/loadInfo.service.agent.js";

export const describeMed = tool({
  name: "describe_medicine",
  description:
    "Takes a medicine name and returns its description in any language",
  parameters: z.object({
    medicineName: z.string().describe("Medicine name to describe"),
  }),
  execute: async ({ medicineName }) => {
    const products = loadProducts(2);

    const product = products.find((p) =>
      p["product name"]?.toLowerCase().includes(medicineName.toLowerCase()),
    );

    if (!product) {
      return {
        description: "Medicine not found.",
      };
    }

    return {
      description: product["descriptions"] || "No description available.",
    };
  },
});
