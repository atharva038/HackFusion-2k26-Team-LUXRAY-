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
                user: 'atharvsjoshi2005@gmail.com', // your gmail
                pass: 'rjbzovtixfgpjjdx'  // your app password
            }
        });
        try {
            const mailOptions = {
                from: `"AI Pharmacy Assistant" atharvsjoshi2005@gmail.com`,
                to: email,
                subject: `💊 Time for your medication: ${medicineName}`,
                text: `Hi ${userName}, take ${medicineName}...`
            };

            const info = await transporter.sendMail(mailOptions);
            console.log("✅ Email sent:", info.response);
            return { status: "success", info: info.response };
        } catch (err) {
            console.error("❌ NODEMAILER ERROR:", err.message);
            throw new Error(`Email failed: ${err.message}`); // Tell the agent it failed
        }
    }
})