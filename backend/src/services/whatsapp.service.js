import twilio from "twilio";
import { generateInvoicePdf } from "./invoicePdf.service.js";

// ─── Twilio Client (lazy-initialized) ───────────────────────────────────────
let client = null;

function getClient() {
    if (!client) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken) {
            console.warn("[WhatsApp] Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
            return null;
        }
        client = twilio(accountSid, authToken);
    }
    return client;
}

/**
 * Normalize a raw phone number to WhatsApp format.
 * Accepts: "9876543210", "+919876543210", "919876543210"
 * Returns: "whatsapp:+919876543210"
 */
function toWhatsAppNumber(phone) {
    if (!phone) return null;
    let digits = phone.replace(/\D/g, "");
    // Remove leading zero (e.g. "09876543210" → "9876543210")
    if (digits.startsWith("0")) digits = digits.slice(1);
    const e164 = digits.length === 10 ? `+91${digits}` : `+${digits}`;
    return `whatsapp:${e164}`;
}

/**
 * Send a payment invoice WhatsApp message.
 *
 * @param {string} phone - User's phone number
 * @param {object} details
 * @param {string} details.invoiceId     - Invoice ID
 * @param {string} details.orderId       - MongoDB Order ID
 * @param {string} details.customerName  - Customer name
 * @param {string} details.customerEmail - Customer email
 * @param {string} details.medicines     - Comma-separated medicine names
 * @param {number} details.totalItems    - Total quantity
 * @param {number} details.totalAmount   - Total amount in ₹
 */
export async function sendPaymentInvoice(phone, details) {
    const twClient = getClient();
    const to = toWhatsAppNumber(phone);
    const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    if (!twClient) {
        console.warn("[WhatsApp] Skipping invoice — Twilio client not initialized (missing credentials).");
        return;
    }
    if (!to) {
        console.warn("[WhatsApp] Skipping invoice — no phone number provided for user.");
        return;
    }

    console.log(`[WhatsApp] Sending invoice to ${to} from ${from}`);

    const { invoiceId, orderId, medicines, totalAmount, customerName, totalItems } = details;

    const now = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const body =
        `✅ *Payment Confirmed — MediAI Pharmacy*\n\n` +
        `Hello ${customerName || "Customer"}, your payment has been successfully received.\n\n` +
        `🧾 *Invoice ID:* ${invoiceId}\n` +
        `📦 *Order ID:* ${orderId}\n` +
        `💊 *Medicines:* ${medicines || "your items"}\n` +
        `🔢 *Total Qty:* ${totalItems || 1}\n` +
        `💰 *Amount Paid:* ₹${totalAmount}\n` +
        `🕐 *Date & Time:* ${now}\n\n` +
        `Your order is now being processed and will be dispatched shortly.\n\n` +
        `_Thank you for choosing MediAI Pharmacy!_ 🏥`;

    try {
        const msg = await twClient.messages.create({ from, to, body });
        console.log(`[WhatsApp] ✅ Invoice sent to ${to} — SID: ${msg.sid}`);
    } catch (err) {
        const code = err.code || "unknown";
        const moreInfo = err.moreInfo || "";
        console.error(`[WhatsApp] ❌ Failed to send invoice to ${to} — Error ${code}: ${err.message}`);
        if (moreInfo) console.error(`[WhatsApp]    More info: ${moreInfo}`);

        // Sandbox-specific guidance
        if (code === 63016 || code === 63007) {
            console.error(
                `[WhatsApp] ⚠️  Sandbox session issue. The recipient must first send` +
                ` "join <your-sandbox-keyword>" to ${from.replace("whatsapp:", "")} on WhatsApp.` +
                ` Check your Twilio Console → Messaging → Try it out → WhatsApp.`
            );
        }
        if (code === 21608 || code === 21211) {
            console.error(`[WhatsApp] ⚠️  Invalid 'to' number: ${to}. Check the phone stored in the user profile.`);
        }
        if (code === 20003) {
            console.error(`[WhatsApp] ⚠️  Authentication failed. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env`);
        }
    }
}
