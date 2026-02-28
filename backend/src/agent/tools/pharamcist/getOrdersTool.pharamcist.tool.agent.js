import { tool } from "@openai/agents";
import { z } from "zod";
import Order from "../../../models/order.model.js";
import User from "../../../models/user.model.js";

// Register referenced models for populate
import "../../../models/medicine.model.js";

export const getOrdersTool = tool({
  name: "get_orders",
  description:
    "Fetch orders with optional filters. " +
    "Supports filtering by status, user name (partial match), limit, and sort order. " +
    "Always returns orderId, customerName, status, and items so the pharmacist can act on them.",

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
      .default(null)
      .describe("Filter by order status. Pass null to fetch all statuses."),

    userName: z
      .string()
      .nullable()
      .default(null)
      .describe(
        "Filter orders by customer name (partial, case-insensitive). " +
        "Use this when the pharmacist says 'orders for John' or 'approve order for Priya'."
      ),

    limit: z.coerce.number().nullable().default(5)
      .describe("Max number of orders to return. Default 5."),

    sortOrder: z
      .enum(["latest", "oldest"])
      .nullable()
      .default("latest")
      .describe("Sort direction. Default latest."),
  }),

  execute: async ({ status, userName, limit, sortOrder }) => {
    try {
      const query = {};
      if (status) query.status = status;

      // If userName filter is provided, resolve it to user IDs first
      if (userName && userName.trim()) {
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matchedUsers = await User.find({
          name: { $regex: new RegExp(escapeRegex(userName.trim()), "i") },
        }).select("_id").lean();

        if (!matchedUsers.length) {
          return {
            success: false,
            message: `No customer found with name matching "${userName}". Check the spelling and try again.`,
          };
        }

        query.user = { $in: matchedUsers.map((u) => u._id) };
      }

      const finalLimit = limit && limit > 0 ? Math.min(limit, 50) : 5;
      const sort = sortOrder === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

      const orders = await Order.find(query)
        .sort(sort)
        .limit(finalLimit)
        .populate("user", "name email")
        .populate("items.medicine", "name price prescriptionRequired")
        .lean();

      if (!orders.length) {
        return {
          success: false,
          message: status
            ? `No ${status} orders found${userName ? ` for "${userName}"` : ""}.`
            : `No orders found${userName ? ` for "${userName}"` : ""}.`,
        };
      }

      return {
        success: true,
        count: orders.length,
        orders: orders.map((order) => ({
          orderId: order._id.toString(),
          customerName: order.user?.name || "Unknown",
          customerEmail: order.user?.email || "",
          status: order.status,
          totalItems: order.totalItems,
          totalAmount: order.totalAmount != null ? `€${order.totalAmount.toFixed(2)}` : "N/A",
          createdAt: new Date(order.createdAt).toLocaleString(),
          items: order.items.map((item) => ({
            medicine: item.medicine?.name || "Unknown",
            quantity: item.quantity,
          })),
        })),
      };
    } catch (error) {
      console.error("get_orders error:", error);
      return { success: false, message: "Error fetching orders." };
    }
  },
});
