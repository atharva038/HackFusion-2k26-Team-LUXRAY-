/**
 * warehouse.fulfillment.service.js
 *
 * Handles automated warehouse fulfillment when an order is finalized (paid).
 *
 * Flow:
 *   1. Payment confirmed → triggerWarehouseFulfillment()
 *   2. Internally fires a mock Webhook to a warehouse endpoint (logged + stored)
 *   3. Auto-marks the order as 'dispatched' after the warehouse ack
 *   4. Deducts stock + logs inventory change
 *   5. Sends dispatch confirmation:
 *       - Email to customer
 *       - WhatsApp to customer
 *       - Email to all pharmacists/admins (fulfillment report)
 */

import Order from '../models/order.model.js';
import Medicine from '../models/medicine.model.js';
import InventoryLog from '../models/inventoryLog.model.js';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';
import { emitToUser, isSocketInitialized, getIO } from '../config/socket.js';
import { sendDispatchConfirmation } from './email.fulfillment.service.js';

// ─── Mock Warehouse Webhook ────────────────────────────────────────────────
// In production this would be a real HTTP POST to your 3PL/WMS (e.g. ShipRocket, GoFr).
// Here we log every step and simulate the fulfillment acknowledgement.

const MOCK_WAREHOUSE_URL = process.env.WAREHOUSE_WEBHOOK_URL || 'https://mock-warehouse.internal/api/fulfillment';

/**
 * Simulate sending a fulfillment request to the warehouse webhook.
 * Returns a mock acknowledgement object.
 */
async function fireWarehouseWebhook(order) {
    const payload = {
        event: 'order.fulfillment_requested',
        sentAt: new Date().toISOString(),
        fulfillmentRequest: {
            externalOrderId: order._id.toString(),
            invoiceId: order.invoiceId,
            customerName: order.user?.name,
            customerEmail: order.user?.email,
            customerPhone: order.user?.phone,
            items: order.items.map(item => ({
                medicineId: (item.medicine?._id || item.medicine).toString(),
                medicineName: item.medicine?.name || 'Unknown',
                quantity: item.quantity,
                unitType: item.medicine?.unitType || 'unit',
            })),
            totalAmount: order.totalAmount,
        },
    };

    // ── Real webhook call  ─────────────────────────────────────────────────
    // In a real integration: await fetch(MOCK_WAREHOUSE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    // For the hackathon we simulate the call and log it:
    logger.info(`[Warehouse] 📦 Firing fulfillment webhook → ${MOCK_WAREHOUSE_URL}`);
    logger.info(`[Warehouse] Payload: ${JSON.stringify(payload, null, 2)}`);

    // Simulate a 300ms warehouse API latency
    await new Promise(resolve => setTimeout(resolve, 300));

    const ack = {
        warehouseRef: `WH-${Date.now()}`,
        status: 'accepted',
        estimatedDispatchIn: '2 hours',
        receivedAt: new Date().toISOString(),
    };

    logger.info(`[Warehouse] ✅ Warehouse ACK: ${JSON.stringify(ack)}`);
    return ack;
}

// ─── Main Fulfillment Trigger ──────────────────────────────────────────────

/**
 * triggerWarehouseFulfillment
 *
 * Called automatically after payment is confirmed.
 * Runs asynchronously (fire-and-forget from the caller).
 *
 * @param {Object} order - Mongoose document with populated user + items.medicine
 */
export async function triggerWarehouseFulfillment(order) {
    try {
        logger.info(`[Fulfillment] 🚀 Starting warehouse fulfillment for Order ${order._id}`);

        // ── Step 1: Fire mock warehouse webhook ───────────────────────────
        const warehouseAck = await fireWarehouseWebhook(order);

        // ── Step 2: Auto-dispatch the order ───────────────────────────────
        order.status = 'dispatched';
        order.warehouseRef = warehouseAck.warehouseRef;
        order.dispatchedAt = new Date();
        await order.save();

        logger.info(`[Fulfillment] ✅ Order ${order._id} auto-dispatched. WarehouseRef: ${warehouseAck.warehouseRef}`);

        // ── Step 3: Deduct stock from inventory ───────────────────────────
        for (const item of order.items) {
            const medId = item.medicine?._id || item.medicine;
            await Medicine.findByIdAndUpdate(medId, { $inc: { stock: -item.quantity } });
            await InventoryLog.create({
                medicine: medId,
                changeType: 'deduct',
                quantity: item.quantity,
                order: order._id,
            });
        }
        logger.info(`[Fulfillment] 📉 Stock deducted for ${order.items.length} item(s)`);

        // ── Step 4: Real-time socket notification to customer + admin ─────
        if (isSocketInitialized()) {
            const userId = order.user?._id?.toString() ?? order.user?.toString();
            const dispatchPayload = {
                orderId: order._id.toString(),
                status: 'dispatched',
                warehouseRef: warehouseAck.warehouseRef,
                message: '🚚 Your order has been dispatched from our warehouse!',
            };
            if (userId) {
                emitToUser(userId, 'order:dispatched', dispatchPayload);
                emitToUser(userId, 'order:status-updated', dispatchPayload);
            }
            getIO().emit('order:admin-updated', {
                ...dispatchPayload,
                userName: order.user?.name,
            });
        }

        // ── Step 5: Notifications (fire-and-forget) ───────────────────────
        const medicineNames = order.items.map(i => i.medicine?.name || 'Medicine').join(', ');

        const notifPayload = {
            invoiceId: order.invoiceId,
            orderId: order._id.toString(),
            warehouseRef: warehouseAck.warehouseRef,
            customerName: order.user?.name || 'Customer',
            customerEmail: order.user?.email || '',
            medicines: medicineNames,
            totalItems: order.totalItems || order.items.length,
            totalAmount: order.totalAmount,
            estimatedDispatchIn: warehouseAck.estimatedDispatchIn,
        };

        // Email confirmation to customer
        if (order.user?.email) {
            sendDispatchConfirmation(order.user.email, notifPayload)
                .catch(err => logger.error(`[Fulfillment/Email] Customer dispatch email error: ${err.message}`));
        }

        // Email fulfillment report to all pharmacists + admins
        const staff = await User.find({ role: { $in: ['admin', 'pharmacist'] } }).select('email').lean();
        const staffEmails = staff.map(u => u.email).filter(Boolean);
        if (staffEmails.length > 0) {
            sendDispatchConfirmation(staffEmails, { ...notifPayload, isStaffReport: true })
                .catch(err => logger.error(`[Fulfillment/Email] Staff fulfillment report error: ${err.message}`));
        }

        logger.info(`[Fulfillment] 🎉 Fulfillment complete for Order ${order._id}`);

    } catch (err) {
        logger.error(`[Fulfillment] ❌ Fulfillment failed for Order ${order._id}: ${err.message}`);
        // Never rethrow — fulfillment failure must not break the payment confirmation response
    }
}
