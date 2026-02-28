/**
 * whatsapp.fulfillment.service.js
 * Sends dispatch confirmation WhatsApp messages via Twilio.
 */

import twilio from 'twilio';

let client = null;

function getClient() {
    if (!client) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            console.warn('[WhatsApp/Fulfillment] Twilio credentials not configured.');
            return null;
        }
        client = twilio(accountSid, authToken);
    }
    return client;
}

function toWhatsAppNumber(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    const e164 = digits.length === 10 ? `+91${digits}` : `+${digits}`;
    return `whatsapp:${e164}`;
}

/**
 * Send a dispatch confirmation WhatsApp message to the customer.
 * @param {string} phone          - Customer phone
 * @param {object} data           - Fulfillment data
 */
export async function sendDispatchWhatsApp(phone, data) {
    const twClient = getClient();
    const to = toWhatsAppNumber(phone);
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!twClient || !to) {
        console.warn('[WhatsApp/Fulfillment] Skipping dispatch message — no client or phone.');
        return;
    }

    const {
        invoiceId, orderId, warehouseRef,
        customerName, medicines, totalAmount, estimatedDispatchIn,
    } = data;

    const now = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const body =
        `🚚 *Order Dispatched — MediAI Pharmacy*\n\n` +
        `Hello ${customerName || 'Customer'}, your order is on its way!\n\n` +
        `🧾 *Invoice:* ${invoiceId}\n` +
        `📦 *Order ID:* ${orderId}\n` +
        `💊 *Medicines:* ${medicines}\n` +
        `💰 *Amount:* ₹${totalAmount}\n` +
        `🏭 *Warehouse Ref:* ${warehouseRef}\n` +
        `⏱ *Est. Delivery:* ${estimatedDispatchIn}\n` +
        `🕐 *Dispatched At:* ${now}\n\n` +
        `Track your order in the app under *My Orders*.\n\n` +
        `_Thank you for choosing MediAI Pharmacy!_ 💊`;

    try {
        const msg = await twClient.messages.create({ from, to, body });
        console.log(`[WhatsApp/Fulfillment] ✅ Dispatch message sent to ${to} — SID: ${msg.sid}`);
    } catch (err) {
        console.error(`[WhatsApp/Fulfillment] ❌ Failed to send to ${to}:`, err.message);
        throw err; // Re-throw so the caller can .catch() it
    }
}
