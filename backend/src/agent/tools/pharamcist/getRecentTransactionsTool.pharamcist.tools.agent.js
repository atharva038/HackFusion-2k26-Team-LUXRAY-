import { tool } from "@openai/agents";
import { z } from "zod";
import Order from "../../../models/order.model.js";
import Medicine from "../../../models/medicine.model.js";

export const getRecentTransactionsTool = tool({
  name: "get_recent_transactions",
  description:
    "Get recent medicine sales summary to analyze demand and inventory trends",

  parameters: z.object({
    days: z.coerce.number().nullable().default(7), // last N days
    limit: z.coerce.number().nullable().default(20), // top medicines
  }),

  execute: async ({ days, limit }) => {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - (days || 7));

      // 1. Get recent approved/dispatched orders
      const orders = await Order.find({
        createdAt: { $gte: fromDate },
        status: { $in: ["approved", "dispatched"] },
      }).populate("items.medicine");

      // 2. Create sales map
      const salesMap = {};

      orders.forEach((order) => {
        order.items.forEach((item) => {
          const med = item.medicine;
          if (!med) return;

          const medId = med._id.toString();

          if (!salesMap[medId]) {
            salesMap[medId] = 0;
          }

          salesMap[medId] += item.quantity;
        });
      });

      // 3. Get ALL medicines (important)
      const medicines = await Medicine.find({});

      const analysis = medicines.map((med) => {
        const medId = med._id.toString();
        const totalSold = salesMap[medId] || 0;
        const stock = med.stock;

        // Demand category
        let demandCategory = "no_demand";
        if (totalSold > 50) demandCategory = "high_demand";
        else if (totalSold > 20) demandCategory = "medium_demand";
        else if (totalSold > 0) demandCategory = "low_demand";

        // Stock status
        let stockStatus = "normal";
        if (stock === 0) stockStatus = "out_of_stock";
        else if (stock <= med.lowStockThreshold) stockStatus = "low_stock";
        else if (stock > totalSold * 5 && totalSold > 0)
          stockStatus = "overstock";

        return {
          medicineId: medId,
          name: med.name,
          currentStock: stock,
          totalSold,
          demandCategory,
          stockStatus,
        };
      });

      // Sort by demand
      const sorted = analysis
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, limit || 20);

      return {
        success: true,
        periodDays: days || 7,
        medicinesAnalyzed: sorted.length,
        inventoryInsights: sorted,
      };
    } catch (error) {
      console.error("get_recent_transactions error:", error);
      return {
        success: false,
        message: "Error analyzing inventory",
      };
    }
  },
});
