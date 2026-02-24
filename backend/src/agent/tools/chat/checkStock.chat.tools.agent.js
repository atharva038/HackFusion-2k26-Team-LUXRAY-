import { tool } from "@openai/agents";
import { z } from "zod";
import { loadProducts } from "../../service/loadInfo.service.agent.js";

export const checkStock = tool({
  name: "check_medicine_details",
  description:
    "Get medicine details and stock using medicine name, product id or PZN",

  parameters: z.object({
    medicineName: z
      .string()
      .describe("Medicine name (use empty string if not provided)"),
    id: z
      .string()
      .describe("Product ID (use empty string if not provided)"),
    pzn: z
      .string()
      .describe("PZN number (use empty string if not provided)")
  }).strict(),

  execute: async ({ medicineName, id, pzn }) => {
    if (!medicineName && !id && !pzn) {
      return { error: "Provide medicineName or id or pzn" };
    }

    const products = await loadProducts(2);

    const nameQuery = medicineName?.toLowerCase().trim();

    const product = products.find((p) => {
      if (id) return String(p["product id"]) === String(id);
      if (pzn) return String(p.pzn) === String(pzn);
      if (nameQuery)
        return p["product name"]?.toLowerCase().includes(nameQuery);
      return false;
    });

    if (!product) {
      return { error: "Medicine not found" };
    }

    const quantity = product.Current_Quantity ?? 0;

    return {
      product_id: product["product id"],
      product_name: product["product name"],
      price: product["price rec"],
      quantity,
      status: quantity > 0 ? "In Stock" : "Out of Stock",
    };
  },
});