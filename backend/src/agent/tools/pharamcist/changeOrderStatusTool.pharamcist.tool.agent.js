import { tool } from "@openai/agents";
import { z } from "zod";
import Order from "../../../models/order.model.js";
import mongoose from "mongoose";

export const changeOrderStatusTool = tool({
  name: "change_order_status",
  description: "Change the status of an order",

  parameters: z.object({
    orderId: z.string().describe("MongoDB Order ID"),

    status: z.enum([
      "pending",
      "approved",
      "rejected",
      "awaiting_prescription",
      "dispatched",
    ]),

    rejectionReason: z.string().nullable().default(null),
    approvedBy: z.string().nullable().default(null),
  }),

  execute: async ({ orderId, status, rejectionReason, approvedBy }) => {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return {
        success: false,
        message: "Invalid order ID format. Please provide a valid Order ID.",
      };
    }

    const updateData = { status };

    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    if (status === "approved" && approvedBy) {
      updateData.approvedBy = approvedBy;
    }

    const order = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
    });

    if (!order) {
      return {
        success: false,
        message: "Order not found with this ID.",
      };
    }

    return {
      success: true,
      orderId: order._id.toString(),
      status: order.status,
      message: `Order ${order._id} updated to ${order.status}`,
    };
  },
});