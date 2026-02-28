import crypto from "crypto";
import Order from "../models/order.model.js";
import ChatSession from "../models/chatSession.model.js";
import { appendSessionMessages } from "../services/cache.service.js";
import { sendPaymentInvoice } from "../services/whatsapp.service.js";
import { sendInvoiceWithPdf } from "../agent/service/email.service.agent.js";
import { isSocketInitialized, getIO, emitToUser } from "../config/socket.js";
import { triggerWarehouseFulfillment } from "../services/warehouse.fulfillment.service.js";

/** Emit payment-confirmed socket events to both the customer and all admins */
function emitPaymentConfirmed(order) {
    if (!isSocketInitialized()) return;
    const orderId = order._id.toString();
    const userId  = order.user?._id?.toString();
    const payload = {
        orderId,
        status:        order.status,
        paymentStatus: order.paymentStatus,
        invoiceId:     order.invoiceId,
        totalAmount:   order.totalAmount,
    };
    // Notify the customer so MyOrders updates immediately
    if (userId) emitToUser(userId, 'order:status-updated', payload);
    // Notify all admins — order:new triggers the "new order" notification banner
    // order:admin-updated keeps the Orders table row in sync
    getIO().emit('order:new', {
        ...payload,
        user: { name: order.user?.name, email: order.user?.email },
        items: order.items?.map(i => ({ name: i.medicine?.name || i.name, quantity: i.quantity })) ?? [],
    });
    getIO().emit('order:admin-updated', {
        ...payload,
        userName: order.user?.name,
    });
}

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

                // Real-time update for admin Orders table + customer MyOrders page
                emitPaymentConfirmed(order);

                console.log(`[Webhook] Payment successful for order ${order._id}, Invoice: ${invoiceId}`);

                // ─── Auto Warehouse Fulfillment (fire-and-forget) ────────────
                // Triggers mock webhook → auto-dispatch → stock deduction → email
                triggerWarehouseFulfillment(order).catch(err =>
                    console.error('[Webhook] Warehouse fulfillment error:', err.message)
                );

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

/**
 * Client-side payment verification (called directly from frontend after Razorpay handler fires).
 * This is the PRIMARY confirmation path in production where webhooks may not be configured.
 * POST /api/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: "Missing payment verification fields" });
        }

        // Verify Razorpay signature: HMAC-SHA256 of "orderId|paymentId"
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (secret) {
            const expectedSig = crypto
                .createHmac("sha256", secret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");

            if (expectedSig !== razorpay_signature) {
                return res.status(400).json({ error: "Payment verification failed — invalid signature" });
            }
        } else {
            console.warn("[Verify] RAZORPAY_KEY_SECRET not set — skipping signature check");
        }

        // Find and update the order
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id })
            .populate('items.medicine')
            .populate('user', 'phone name email');

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Idempotent — skip if already paid
        if (order.paymentStatus === "paid") {
            return res.json({ success: true, invoiceId: order.invoiceId, alreadyPaid: true });
        }

        const invoiceId = `INV-${Math.floor(Date.now() / 1000).toString().substring(2)}${Math.floor(Math.random() * 1000)}`;

        order.paymentStatus = "paid";
        order.status = "paid";
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        order.invoiceId = invoiceId;
        await order.save();

        // Real-time update for admin Orders table + customer MyOrders page
        emitPaymentConfirmed(order);

        console.log(`[Verify] Payment confirmed for order ${order._id}, Invoice: ${invoiceId}`);

        // ─── Auto Warehouse Fulfillment (fire-and-forget) ────────────────────
        // Triggers mock webhook → auto-dispatch → stock deduction → email
        triggerWarehouseFulfillment(order).catch(err =>
            console.error('[Verify] Warehouse fulfillment error:', err.message)
        );

        const medicineNames = order.items?.length
            ? order.items.map(i => i.medicine?.name || 'Medicine').join(', ')
            : 'your items';

        const totalAmount = order.totalAmount || (parseInt(req.body.amount) / 100) || 0;

        // Fire notifications (fire-and-forget)
        const userPhone = order.user?.phone;
        if (userPhone) {
            sendPaymentInvoice(userPhone, {
                invoiceId,
                orderId: order._id.toString(),
                customerName: order.user?.name || 'Customer',
                customerEmail: order.user?.email || '',
                medicines: medicineNames,
                totalItems: order.totalItems || 1,
                totalAmount,
            }).catch(err => console.error('[Verify/WhatsApp]', err.message));
        }

        const userEmail = order.user?.email;
        if (userEmail) {
            sendInvoiceWithPdf(userEmail, {
                invoiceId,
                orderId: order._id.toString(),
                customerName: order.user?.name || 'Customer',
                customerEmail: userEmail,
                medicines: medicineNames,
                totalItems: order.totalItems || 1,
                totalAmount,
            }).catch(err => console.error('[Verify/Email]', err.message));
        }

        // Inject confirmation into chat session
        try {
            const latestSession = await ChatSession.findOne({ user: order.user }).sort({ updatedAt: -1 });
            if (latestSession) {
                const successMessage = {
                    role: 'ai',
                    content: `**Payment Confirmed!**\n\nYour payment has been successfully processed. Here is your invoice for this transaction.\n\nInvoice ID: ${invoiceId}\nOrder ID: ${order._id}\nAmount Paid: ₹${totalAmount}\nStatus: paid\nItems: ${medicineNames}`
                };
                appendSessionMessages(latestSession._id.toString(), [successMessage]);

                const sessionDoc = await ChatSession.findById(latestSession._id);
                if (sessionDoc) {
                    for (let i = sessionDoc.messages.length - 1; i >= 0; i--) {
                        const msg = sessionDoc.messages[i];
                        if (msg.role === 'ai' && (msg.content.includes(order._id.toString()) || msg.content.includes(razorpay_order_id))) {
                            msg.content = msg.content.replace(/Status:\s*awaiting_payment/gi, 'Status: paid');
                            break;
                        }
                    }
                    sessionDoc.messages.push(successMessage);
                    await sessionDoc.save();
                }
            }
        } catch (chatErr) {
            console.error("[Verify] Failed to inject into chat:", chatErr.message);
        }

        return res.json({ success: true, invoiceId });
    } catch (error) {
        console.error("[Verify Error]:", error);
        res.status(500).json({ error: "Payment verification failed" });
    }
};
