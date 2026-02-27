import { tool } from "@openai/agents";
import { z } from "zod";
import Order from "../../../models/order.model.js";

// Register referenced models for populate
import "../../../models/user.model.js";
import "../../../models/medicine.model.js";

export const getOrdersTool = tool({
  name: "get_orders",
  description:
    "Fetch orders based on filters like status, limit and sorting",

  parameters: z.object({
    status: z
      .enum([
        "pending",
        "approved",
        "rejected",
        "awaiting_prescription",
        "dispatched",
      ])
      .nullable()
      .default(null),

    limit: z.coerce.number().nullable().default(5),

    sortOrder: z
      .enum(["latest", "oldest"])
      .nullable()
      .default("latest"),
  }),

  execute: async ({ status, limit, sortOrder }) => {
    try {
      const query = {};
      if (status) query.status = status;

      const finalLimit = limit && limit > 0 ? limit : 5;

      const sort =
        sortOrder === "oldest"
          ? { createdAt: 1 }
          : { createdAt: -1 };

      const orders = await Order.find(query)
        .sort(sort)
        .limit(finalLimit)
        .populate("user", "name email role")
        .populate("items.medicine", "name price prescriptionRequired");

      if (!orders.length) {
        return {
          success: false,
          message: "No orders found",
        };
      }

      return {
        success: true,
        count: orders.length,
        orders: orders.map((order) => ({
          orderId: order._id.toString(),
          status: order.status,
          user: order.user,
          totalItems: order.totalItems,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            medicine: item.medicine?.name || "Unknown",
            quantity: item.quantity,
          })),
        })),
      };
    } catch (error) {
      console.error("get_orders error:", error);
      return {
        success: false,
        message: "Error fetching orders",
      };
    }
  },
});