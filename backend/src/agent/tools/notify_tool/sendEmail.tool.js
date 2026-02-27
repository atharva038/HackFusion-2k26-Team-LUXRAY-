import { tool } from '@openai/agents'
import { z } from 'zod'
import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmailTool = tool({
    name: 'send_medication_email',
    description: 'Sends a reminder or refill email to a specific user.',
    parameters: z.object({
        email: z.string(),
        userName: z.string(),
        medicineName: z.string(),
        dosage: z.string().describe("The dosage (e.g. 500mg). Pass an empty string if not applicable."),
        instructions: z.string().describe("Instructions for the medicine. If none, provide an empty string ''."), 
        messageType: z.enum(['reminder', 'refill']).describe("The type of email: 'reminder' for daily doses, 'refill' for reordering.")
    }),
    execute: async ({ email, userName, medicineName, dosage, instructions, messageType }) => {
        
        
        const isRefill = messageType === 'refill';
        
        const subject = isRefill 
            ? `⚠️ Reorder Alert: Your ${medicineName} is running low` 
            : `💊 Time for your medication: ${medicineName}`;

        const text = isRefill
            ? `Hi ${userName},\n\nOur records show your course of ${medicineName} is almost over. If you still have symptoms, please consider reordering soon to avoid missing a dose.\n\nStay healthy!`
            : `Hi ${userName},\n\nThis is a reminder to take your ${medicineName} (${dosage}).\nInstructions: ${instructions}\n\nStay healthy!`;

        const mailOptions = {
            from: `"AI Pharmacy Assistant" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            text: text
        };

        try {
            await transporter.sendMail(mailOptions);
            return { status: "success", type: messageType, sentTo: email };
        } catch (error) {
            console.error("Email Tool Error:", error);
            throw new Error(`Failed to send ${messageType} email.`);
        }
    }
});