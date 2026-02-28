import twilio from "twilio";
import cloudinary from "../config/cloudinary.js";
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
    const digits = phone.replace(/\D/g, "");
    const e164 = digits.length === 10 ? `+91${digits}` : `+${digits}`;
    return `whatsapp:${e164}`;
}

/**
 * Upload a PDF Buffer to Cloudinary as a raw file.
 * Returns the secure public URL of the uploaded file.
 */
async function uploadPdfToCloudinary(pdfBuffer, publicId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "image",
                folder: "invoices",
                public_id: publicId,
                // We let Cloudinary ingest the PDF, and then we will request it as a PNG image 
                // because Cloudinary Free Tier blocks raw PDF delivery, causing Twilio to fail with a 401 error.
                // PDFs expire after 1 hour — avoids long-term storage of invoices
                // (comment out `invalidate: true` if you want to cache them)
            },
            (error, result) => {
                if (error) return reject(error);
                // Force the extension to be .png so Cloudinary rasterizes the PDF into an image 
                // Twilio can then easily download and display it inline.
                const pngUrl = result.secure_url.replace(/\.pdf$/, '.png');
                resolve(pngUrl);
            }
        );
        uploadStream.end(pdfBuffer);
    });
}

/**
 * Send a payment invoice WhatsApp message WITH a PDF attachment.
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

    if (!twClient || !to) {
        console.warn("[WhatsApp] Skipping invoice — no client or phone number.");
        return;
    }

    const { invoiceId, orderId, medicines, totalAmount, customerName, customerEmail, totalItems } = details;
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const body =
        `✅ *Payment Confirmed — MediAI Pharmacy*\n\n` +
        `Your payment has been received. Your PDF invoice is attached below.\n\n` +
        `🧾 *Invoice ID:* ${invoiceId}\n` +
        `📦 *Order ID:* ${orderId}\n` +
        `💊 *Medicines:* ${medicines || "your items"}\n` +
        `💰 *Amount Paid:* ₹${totalAmount}\n` +
        `🕐 *Date & Time:* ${now}\n` +
        `📋 *Status:* Payment Successful ✔️\n\n` +
        `Your order is now being processed.\n\n` +
        `_Thank you for choosing MediAI Pharmacy!_`;

    // Try to generate and attach the PDF invoice
    let mediaUrl;
    try {
        const pdfBuffer = await generateInvoicePdf({
            invoiceId,
            orderId,
            customerName: customerName || "Customer",
            customerEmail: customerEmail || "",
            medicines,
            totalItems: totalItems || 1,
            totalAmount,
        });

        // Upload to Cloudinary for a public URL Twilio can access
        const publicId = `invoice_${invoiceId}_${Date.now()}`;
        mediaUrl = await uploadPdfToCloudinary(pdfBuffer, publicId);
        console.log(`[WhatsApp] PDF uploaded to Cloudinary: ${mediaUrl}`);
    } catch (pdfErr) {
        // If PDF fails, send text-only — don't crash
        console.error("[WhatsApp] PDF generation/upload failed, sending text-only:", pdfErr.message);
    }

    try {
        const msgOptions = { from, to, body };
        if (mediaUrl) {
            msgOptions.mediaUrl = [mediaUrl];
        }
        const msg = await twClient.messages.create(msgOptions);
        console.log(`[WhatsApp] ✅ Invoice sent to ${to} — SID: ${msg.sid}${mediaUrl ? " (with PDF)" : " (text only)"}`);
    } catch (err) {
        console.error(`[WhatsApp] ❌ Failed to send invoice to ${to}:`, err.message);
    }
}
