import { tool } from "@openai/agents";
import { z } from "zod";
import Razorpay from "razorpay";
import Order from "../../../models/order.model.js";
import dotenv from "dotenv";
dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "test",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "test",
});

export const createPayment = tool({
    name: "create_payment",
    description:
        "Generate a Razorpay payment link or order ID for an awaiting_payment order. " +
        "MUST be called immediately after a successful order_medicine call.",
    parameters: z.object({
        orderId: z.string().describe("The 24-character MongoDB Order ID returned from order_medicine"),
    }),
    execute: async ({ orderId }) => {
        try {
            const order = await Order.findById(orderId);
            if (!order) {
                return "❌ Order not found in database.";
            }

            if (order.status !== "awaiting_payment") {
                return `❌ Cannot create payment: order status is currently '${order.status}'.`;
            }

            const amountInPaise = Math.round(order.totalAmount * 100);

            const options = {
                amount: amountInPaise,
                currency: "INR",
                receipt: `receipt_order_${order._id}`,
            };

            const razorpayOrder = await razorpay.orders.create(options);

            order.razorpayOrderId = razorpayOrder.id;
            await order.save();

            return JSON.stringify({
                success: true,
                razorpayOrderId: razorpayOrder.id,
                amount: order.totalAmount,
                currency: "INR",
                message: "Payment order generated successfully. Provide the payment instructions/link to the user.",
            });
        } catch (error) {
            return `❌ Payment generation failed: ${error.message}`;
        }
    },
});
