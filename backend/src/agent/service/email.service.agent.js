import nodemailer from "nodemailer";
import { generateInvoicePdf } from "../../services/invoicePdf.service.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const orderConfirmation = async (
  patientEmail,
  patientId,
  purchaseDate,
  productName,
  quantity,
  totalPrice,
) => {
  if (!patientEmail) {
    console.error("orderConfirmation: patientEmail is required");
    return { success: false, error: "No recipient email provided" };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: "Order Confirmation - Pharmacy",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c7be5;">Order Confirmation</h2>
        
        <p>Dear Customer,</p>
        
        <p>Thank you for your purchase. Your order has been successfully placed. Below are your order details:</p>

        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Patient ID</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${patientId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Purchase Date</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${purchaseDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Medicine</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Quantity</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Price</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">₹${totalPrice}</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">
          Your order will be processed shortly. If you have any questions, please contact our support team.
        </p>

        <p>Thank you for choosing our pharmacy.</p>

        <p>
          Regards,<br/>
          <strong>Pharmacy Support Team</strong>
        </p>

        <hr style="margin-top: 20px;" />
        <small>This is an automated email. Please do not reply directly to this message.</small>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};

import { openai } from '../../config/openai.js';

/**
 * Send a low-stock alert email to pharmacists/admins.
 * @param {string[]} recipientEmails - Array of email addresses to notify
 * @param {Array<{name:string, stock:number, lowStockThreshold:number, unitType:string}>} medicines
 * @returns {{ success: boolean, error?: string }}
 */
export const sendLowStockAlert = async (recipientEmails, medicines) => {
  if (!recipientEmails || recipientEmails.length === 0) {
    console.error("sendLowStockAlert: no recipient emails provided");
    return { success: false, error: "No recipient emails provided" };
  }
  if (!medicines || medicines.length === 0) {
    return { success: false, error: "No low-stock medicines provided" };
  }

  // 1. Give the context to the AI Agent
  const dataContext = medicines
    .map(m => `- ${m.name}: ${m.stock} ${m.unitType}(s) left (Threshold: ${m.lowStockThreshold})`)
    .join('\n');

  // 2. Instruct the AI Agent to design the urgent email HTML
  let aiHtmlBody;
  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an AI Inventory Agent for an autonomous pharmacy system. Your job is to draft an extremely polished, professional, and visually clear HTML email to warn human pharmacists about critically low stock. Include a beautiful, clear HTML table summarizing the depleted medicines. Do NOT wrap the HTML in markdown blocks like ```html. Output raw HTML only.'
        },
        {
          role: 'user',
          content: `Please generate the HTML email body. The following medicines are dangerously low:\n\n${dataContext}`
        }
      ]
    });
    aiHtmlBody = aiResponse.choices[0].message.content.trim();
    // In case the AI still wraps it
    if (aiHtmlBody.startsWith('```html')) aiHtmlBody = aiHtmlBody.replace(/^```html\s*/, '');
    if (aiHtmlBody.endsWith('```')) aiHtmlBody = aiHtmlBody.replace(/\s*```$/, '');
  } catch (error) {
    console.error("Failed to generate AI email template, falling back to primitive text.", error);
    aiHtmlBody = `<h2>Low Stock Alert</h2><pre>${dataContext}</pre><p>Please restock immediately.</p>`;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmails.join(", "),
    subject: `⚠️ Urgent Low Stock Alert — ${medicines.length} medicine(s) need restocking`,
    html: aiHtmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Low stock alert email error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a payment-confirmed email WITH a PDF invoice attached.
 *
 * @param {string} toEmail       - Recipient email
 * @param {object} invoiceData   - Data for PDF generation
 */
export const sendInvoiceWithPdf = async (toEmail, invoiceData) => {
  if (!toEmail) {
    console.warn("[Email] sendInvoiceWithPdf: no recipient email.");
    return { success: false, error: "No recipient email" };
  }

  let pdfBuffer;
  try {
    pdfBuffer = await generateInvoicePdf(invoiceData);
  } catch (err) {
    console.error("[Email] PDF generation failed:", err.message);
    return { success: false, error: "PDF generation failed" };
  }

  const { invoiceId, orderId, customerName, medicines, totalAmount } = invoiceData;
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const mailOptions = {
    from: `"MediAI Pharmacy" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Payment Confirmed — Invoice ${invoiceId}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1E293B; max-width: 560px; margin: auto;">
        <div style="background: #2563EB; padding: 24px 30px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #fff; margin: 0;">💊 MediAI Pharmacy</h2>
          <p style="color: #BFDBFE; margin: 4px 0 0;">Payment Confirmation</p>
        </div>
        <div style="background: #F8FAFC; padding: 24px 30px; border: 1px solid #E2E8F0;">
          <p>Dear <strong>${customerName || "Customer"}</strong>,</p>
          <p>Your payment has been successfully received. Please find your invoice attached as a PDF.</p>

          <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
            <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Invoice ID</td><td style="font-weight:bold;">${invoiceId}</td></tr>
            <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Order ID</td><td>${orderId}</td></tr>
            <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Medicines</td><td>${medicines}</td></tr>
            <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Amount Paid</td><td style="font-weight:bold; color:#2563EB;">₹${totalAmount}</td></tr>
            <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Date & Time</td><td>${now}</td></tr>
          </table>

          <p style="font-size:13px; color:#64748B;">Your order is now being processed. You will be notified when it is dispatched.</p>
        </div>
        <div style="padding: 14px 30px; background:#F1F5F9; border: 1px solid #E2E8F0; border-top:0; border-radius: 0 0 8px 8px; font-size:11px; color:#94A3B8;">
          This is an automated email. Please do not reply. · MediAI Pharmacy · HackFusion 2k26
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Invoice-${invoiceId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Invoice email sent to ${toEmail} with PDF attachment`);
    return { success: true };
  } catch (error) {
    console.error("[Email] ❌ Invoice email error:", error.message);
    return { success: false, error: error.message };
  }
};
