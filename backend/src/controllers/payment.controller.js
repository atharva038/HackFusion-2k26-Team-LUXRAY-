import crypto from "crypto";
import Order from "../models/order.model.js";
import ChatSession from "../models/chatSession.model.js";
import { appendSessionMessages } from "../services/cache.service.js";
import { sendPaymentInvoice } from "../services/whatsapp.service.js";
import { sendInvoiceWithPdf } from "../agent/service/email.service.agent.js";

export const handleRazorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "hackfusion2k26";
        const signature = req.headers["x-razorpay-signature"];

        // Validate Signature
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(req.rawBody || JSON.stringify(req.body))
            .digest("hex");

        // Strict validation in production, allow simulated dev requests if signature is missing
        if (expectedSignature !== signature) {
            if (process.env.NODE_ENV === "development" && !signature) {
                console.log("[Webhook] Bypassing signature validation for local development simulation");
            } else {
                return res.status(400).json({ error: "Invalid signature" });
            }
        }

        const event = req.body.event;

        // We only care about successful payments
        if (event === "payment.captured" || event === "order.paid") {
            const paymentEntity = req.body.payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            // Find the order that has this razorpay order ID
            const order = await Order.findOne({ razorpayOrderId: orderId })
                .populate('items.medicine')
                .populate('user', 'phone name email');

            if (order && order.paymentStatus !== "paid") {
                // Generate simple invoice ID
                const invoiceId = `INV-${Math.floor(Date.now() / 1000).toString().substring(2)}${Math.floor(Math.random() * 1000)}`;

                order.paymentStatus = "paid";
                order.status = "paid";
                order.razorpayPaymentId = paymentId;
                order.razorpaySignature = signature;
                order.invoiceId = invoiceId;
                await order.save();

                console.log(`[Webhook] Payment successful for order ${order._id}, Invoice: ${invoiceId}`);

                // ─── Send WhatsApp invoice with PDF ─────────────────────────
                const userPhone = order.user?.phone;
                const medicineNames = order.items && order.items.length > 0
                    ? order.items.map(item => item.medicine?.name || 'Medicine').join(', ')
                    : 'your items';

                if (userPhone) {
                    sendPaymentInvoice(userPhone, {
                        invoiceId,
                        orderId: order._id.toString(),
                        customerName: order.user?.name || 'Customer',
                        customerEmail: order.user?.email || '',
                        medicines: medicineNames,
                        totalItems: order.totalItems || 1,
                        totalAmount: order.totalAmount || (paymentEntity.amount / 100),
                    }).catch(err => console.error('[WhatsApp] Invoice fire-and-forget error:', err));
                } else {
                    console.log('[WhatsApp] No phone number on user — skipping invoice message.');
                }


                // ─── Send email invoice with PDF attachment ────────────────────
                const userEmail = order.user?.email;
                if (userEmail) {
                    sendInvoiceWithPdf(userEmail, {
                        invoiceId,
                        orderId: order._id.toString(),
                        customerName: order.user?.name || 'Customer',
                        customerEmail: userEmail,
                        medicines: medicineNames,
                        totalItems: order.totalItems || 1,
                        totalAmount: order.totalAmount || (paymentEntity.amount / 100),
                    }).catch(err => console.error('[Email] Invoice fire-and-forget error:', err));
                } else {
                    console.log('[Email] No email on user — skipping invoice email.');
                }

                // Send a confirmation & invoice message to the user's latest chat session
                try {
                    const latestSession = await ChatSession.findOne({ user: order.user }).sort({ updatedAt: -1 });
                    if (latestSession) {
                        const medicineNames = order.items && order.items.length > 0
                            ? order.items.map(item => item.medicine?.name || 'Medicine').join(', ')
                            : 'your items';

                        const amountPaid = order.totalAmount || (paymentEntity.amount / 100);

                        // Markdown formatted specifically for detectInvoiceSummary parser
                        const successMessage = {
                            role: 'ai',
                            content: `**Payment Confirmed!**\n\nYour payment has been successfully processed. Here is your invoice for this transaction.\n\nInvoice ID: ${invoiceId}\nOrder ID: ${order._id}\nAmount Paid: ₹${amountPaid}\nStatus: paid\nItems: ${medicineNames}`
                        };

                        // Update Redis cache (fire-and-forget)
                        appendSessionMessages(latestSession._id.toString(), [successMessage]);

                        // Update MongoDB
                        const sessionDoc = await ChatSession.findById(latestSession._id);
                        if (sessionDoc) {
                            // Find the AI message that generated the order summary and rewrite its status 
                            // so that history loading will instantly yield 'paid' on the frontend
                            for (let i = sessionDoc.messages.length - 1; i >= 0; i--) {
                                const msg = sessionDoc.messages[i];
                                if (msg.role === 'ai' && (msg.content.includes(order._id.toString()) || msg.content.includes(orderId))) {
                                    msg.content = msg.content.replace(/Status:\s*awaiting_payment/gi, 'Status: paid');
                                    // Found the order, safe to break out of loop
                                    break;
                                }
                            }

                            // Append the confirmation message
                            sessionDoc.messages.push(successMessage);
                            await sessionDoc.save();
                        }

                        console.log(`[Webhook] Invoice injected into chat session ${latestSession._id}`);
                    }
                } catch (chatErr) {
                    console.error("[Webhook] Failed to inject confirmation into chat:", chatErr);
                }
            }
        }

        res.status(200).json({ status: "ok" });
    } catch (error) {
        console.error("[Webhook Error]:", error);
        res.status(500).json({ error: "Webhook processing failed" });
    }
};

/**
 * Polling endpoint to check payment status
 * GET /api/payment/status/:orderId
 */
export const checkPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ razorpayOrderId: orderId });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json({
            paymentStatus: order.paymentStatus,
            invoiceId: order.invoiceId,
            status: order.status
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch status" });
    }
};
