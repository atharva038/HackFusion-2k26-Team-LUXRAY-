/**
 * email.fulfillment.service.js
 * Sends dispatch confirmation emails — to customers and internal staff.
 */

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an order dispatch confirmation email.
 *
 * @param {string|string[]} toEmail     - Recipient(s)
 * @param {object} data                  - Fulfillment details
 * @param {boolean} data.isStaffReport   - If true, email is addressed to pharmacist staff
 */
export async function sendDispatchConfirmation(toEmail, data) {
    const {
        invoiceId, orderId, warehouseRef, customerName, medicines,
        totalAmount, estimatedDispatchIn, isStaffReport,
    } = data;

    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const to = Array.isArray(toEmail) ? toEmail.join(', ') : toEmail;

    const subject = isStaffReport
        ? `📦 Fulfillment Report — Order ${orderId} Dispatched`
        : `🚚 Your Order Has Been Dispatched — ${invoiceId}`;

    const html = isStaffReport
        ? `
        <div style="font-family: Arial, sans-serif; color: #1E293B; max-width: 560px; margin: auto;">
            <div style="background: #0F172A; padding: 20px 30px; border-radius: 8px 8px 0 0;">
                <h2 style="color: #fff; margin: 0;">📦 Warehouse Fulfillment Report</h2>
                <p style="color: #94A3B8; margin: 4px 0 0;">Internal Pharmacist Notification</p>
            </div>
            <div style="background: #F8FAFC; padding: 24px 30px; border: 1px solid #E2E8F0;">
                <p>An order has been <strong>automatically fulfilled and dispatched</strong> via the warehouse agent.</p>
                <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Order ID</td><td><strong>${orderId}</strong></td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Invoice ID</td><td>${invoiceId}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Warehouse Ref</td><td style="font-family:monospace;">${warehouseRef}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Customer</td><td>${customerName}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Medicines</td><td>${medicines}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Amount</td><td style="font-weight:bold;">₹${totalAmount}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Dispatched At</td><td>${now}</td></tr>
                </table>
                <p style="font-size:13px; color:#64748B;">Stock has been automatically deducted from inventory. No action required.</p>
            </div>
            <div style="padding:12px 30px; background:#F1F5F9; border:1px solid #E2E8F0; border-top:0; border-radius:0 0 8px 8px; font-size:11px; color:#94A3B8;">
                Automated Fulfillment Agent · MediAI Pharmacy · HackFusion 2k26
            </div>
        </div>`
        : `
        <div style="font-family: Arial, sans-serif; color: #1E293B; max-width: 560px; margin: auto;">
            <div style="background: #16A34A; padding: 20px 30px; border-radius: 8px 8px 0 0;">
                <h2 style="color: #fff; margin: 0;">🚚 Your Order is On Its Way!</h2>
                <p style="color: #BBF7D0; margin: 4px 0 0;">Order Dispatch Confirmation</p>
            </div>
            <div style="background: #F8FAFC; padding: 24px 30px; border: 1px solid #E2E8F0;">
                <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
                <p>Great news! Your order has been <strong>dispatched from our warehouse</strong> and is on its way to you.</p>

                <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Invoice ID</td><td><strong>${invoiceId}</strong></td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Order ID</td><td>${orderId}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Medicines</td><td>${medicines}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Amount Paid</td><td style="font-weight:bold; color:#16A34A;">₹${totalAmount}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Warehouse Ref</td><td style="font-family:monospace; font-size:12px;">${warehouseRef}</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Est. Delivery</td><td>${estimatedDispatchIn} from now</td></tr>
                    <tr><td style="padding:8px 0; color:#64748B; font-size:13px;">Dispatched At</td><td>${now}</td></tr>
                </table>

                <p style="font-size:13px; color:#64748B;">You can track your order status in the app under <em>My Orders</em>.</p>
            </div>
            <div style="padding:12px 30px; background:#F1F5F9; border:1px solid #E2E8F0; border-top:0; border-radius:0 0 8px 8px; font-size:11px; color:#94A3B8;">
                This is an automated email · MediAI Pharmacy · HackFusion 2k26
            </div>
        </div>`;

    await transporter.sendMail({
        from: `"MediAI Pharmacy" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
}
