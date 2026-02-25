import { tool } from '@openai/agents'
import { z } from 'zod'
import nodemailer from 'nodemailer'

export const sendEmailTool = tool({
    name: 'send_medication_email',
    description: 'Sends a medicine reminder email to a specific user.',
    parameters: z.object({
        email: z.string(),
        userName: z.string(),
        medicineName: z.string(),
        dosage: z.string(),
        instructions: z.string()
    }),
    execute: async ({ email, userName, medicineName, dosage, instructions }) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // your gmail
                pass: process.env.EMAIL_PASS  // your app password
            }
        });

        const mailOptions = {
            from: `"AI Pharmacy Assistant" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `💊 Time for your medication: ${medicineName}`,
            text: `Hi ${userName},\n\nThis is a reminder to take your ${medicineName} (${dosage}).\nInstructions: ${instructions}\n\nStay healthy!`
        };

        await transporter.sendMail(mailOptions);
        return { status: "success", sentTo: email };
    }
})