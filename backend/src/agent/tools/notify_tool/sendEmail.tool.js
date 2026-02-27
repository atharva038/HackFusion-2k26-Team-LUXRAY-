import { tool } from '@openai/agents';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import logger from '../../../utils/logger.js';

// ── Startup env validation ───────────────────────────────────────────────────
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  logger.warn('⚠️  EMAIL_USER or EMAIL_PASS not set in .env — email features will fail at runtime.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── HTML email builders ──────────────────────────────────────────────────────

const buildRefillHtml = ({ userName, medicineName, dosage, hospital, daysLeft }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f1e8; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #2563eb; padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 28px 32px; }
    .badge { display: inline-block; background: ${daysLeft === 1 ? '#fee2e2' : '#fef3c7'}; color: ${daysLeft === 1 ? '#b91c1c' : '#92400e'}; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
    .card { background: #f5f1e8; border-radius: 12px; padding: 18px 20px; margin: 16px 0; }
    .card p { margin: 6px 0; font-size: 14px; color: #374151; }
    .card strong { color: #111827; }
    .cta { display: block; margin: 24px 0 0; text-align: center; background: #2563eb; color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px; }
    .footer { padding: 16px 32px; border-top: 1px solid #f0ebe0; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>⚠️ Medication Refill Reminder</h1>
    <p>AI Pharmacy Assistant · Automated Alert</p>
  </div>
  <div class="body">
    <p>Hi <strong>${userName || 'Patient'}</strong>,</p>
    <span class="badge">${daysLeft === 1 ? '🚨 Only 1 day left!' : '⏳ 2 days remaining'}</span>
    <p>Our records show your medication is about to run out:</p>
    <div class="card">
      <p><strong>Medicine:</strong> ${medicineName}</p>
      ${dosage ? `<p><strong>Dosage:</strong> ${dosage}</p>` : ''}
      <p><strong>Prescribed at:</strong> ${hospital}</p>
      <p><strong>Days remaining:</strong> ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</p>
    </div>
    <p>To avoid missing a dose, please contact your pharmacy or doctor to arrange a refill.</p>
    <a class="cta" href="#">Request Refill Now</a>
  </div>
  <div class="footer">
    This is an automated reminder from your pharmacy system. Please do not reply to this email.
  </div>
</div>
</body>
</html>
`;

const buildReminderHtml = ({ userName, medicineName, dosage, instructions, hospital }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f1e8; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #059669; padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 28px 32px; }
    .card { background: #f5f1e8; border-radius: 12px; padding: 18px 20px; margin: 16px 0; }
    .card p { margin: 6px 0; font-size: 14px; color: #374151; }
    .card strong { color: #111827; }
    .footer { padding: 16px 32px; border-top: 1px solid #f0ebe0; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>💊 Time to take your medicine</h1>
    <p>AI Pharmacy Assistant · Dose Reminder</p>
  </div>
  <div class="body">
    <p>Hi <strong>${userName || 'Patient'}</strong>,</p>
    <p>This is a friendly reminder to take your medication:</p>
    <div class="card">
      <p><strong>Medicine:</strong> ${medicineName}</p>
      ${dosage ? `<p><strong>Dosage:</strong> ${dosage}</p>` : ''}
      ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ''}
      ${hospital ? `<p><strong>Prescribed at:</strong> ${hospital}</p>` : ''}
    </div>
    <p>Follow your doctor's instructions carefully. Stay healthy! 🌱</p>
  </div>
  <div class="footer">
    This is an automated reminder from your pharmacy system. Please do not reply to this email.
  </div>
</div>
</body>
</html>
`;

// ── Tool definition ──────────────────────────────────────────────────────────

export const sendEmailTool = tool({
  name: 'send_medication_email',
  description: 'Sends a reminder or refill email to a specific user.',
  parameters: z.object({
    email: z.string().email(),
    userName: z.string(),
    medicineName: z.string(),
    dosage: z.string().default('').describe('The dosage (e.g. 500mg). Pass empty string if unknown.'),
    instructions: z.string().default('').describe('Instructions for the medicine. Pass empty string if none.'),
    hospital: z.string().default('').describe('Hospital or clinic name. Pass empty string if unknown.'),
    daysLeft: z.number().default(0).describe('Days left before medicine runs out (0 = not applicable, for reminder emails).'),
    messageType: z.enum(['reminder', 'refill']).describe("'reminder' for daily doses, 'refill' for reorder alerts."),
  }),
  execute: async ({ email, userName, medicineName, dosage, instructions, hospital, daysLeft, messageType }) => {
    const isRefill = messageType === 'refill';

    const subject = isRefill
      ? `⚠️ Refill Alert: ${medicineName} — ${daysLeft ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'running low'}`
      : `💊 Medication Reminder: ${medicineName}`;

    const html = isRefill
      ? buildRefillHtml({ userName, medicineName, dosage, hospital, daysLeft: daysLeft ?? 2 })
      : buildReminderHtml({ userName, medicineName, dosage, instructions, hospital });

    // Plain-text fallback
    const text = isRefill
      ? `Hi ${userName},\n\nYour course of ${medicineName} (${dosage}) ends in ${daysLeft ?? '~2'} day(s). Please arrange a refill at ${hospital || 'your pharmacy'}.\n\nStay healthy!`
      : `Hi ${userName},\n\nReminder: Take your ${medicineName} (${dosage}).\nInstructions: ${instructions}\n\nStay healthy!`;

    const mailOptions = {
      from: `"AI Pharmacy Assistant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`[Email] ✅ ${messageType} email sent to ${email} for ${medicineName}`);
      return { status: 'success', type: messageType, sentTo: email };
    } catch (error) {
      logger.error(`[Email] ❌ Failed to send ${messageType} email to ${email}:`, error.message);
      throw new Error(`Failed to send ${messageType} email to ${email}: ${error.message}`);
    }
  },
});