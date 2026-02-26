import {z} from 'zod'
import { Agent, run } from '@openai/agents';
import { ocrTool } from '../../tools/notify_tool/OCR.notify.tool.agent.js';

const PrescriptionSchema = z.object({
    isPrescription: z.boolean().describe("true if the image is a valid medical prescription, false otherwise"),
    rejection_reason: z.string().optional().describe("If isPrescription is false, explain why (e.g., 'This appears to be a grocery receipt, not a medical prescription')"),
    medicines: z.array(z.object({
        doctor_name: z.string().optional(),
        hospital_name: z.string().optional(),
        user_name: z.string().optional(),
        name: z.string().optional().describe("Medicine name"),
        dosage: z.string(),
        frequency: z.string().describe("e.g., '8am and 8pm' or '1-0-1'"),
        total_quantity: z.number().nullable().optional().describe("Total number of pills/units prescribed"),
        duration_days: z.number().nullable().optional().describe("Number of days to take the medicine"),
        instructions: z.string().optional().describe("e.g., 'after food'")
    }))
});

export const imgAgent = new Agent({
    name: 'image_data_extraction',
    instructions: `
        You are a medical prescription data extractor.
        
        1. Use the extract_text_from_url tool with the provided Cloudinary link.
        2. FIRST, determine if the image is a valid medical prescription.
           - A valid prescription has: doctor name/hospital, patient info, medicine names with dosages.
           - If it is NOT a prescription (e.g., a receipt, random photo, document), set isPrescription to false and give a rejection_reason.
           - If it IS a prescription, set isPrescription to true.
        3. If valid, extract ALL medication names, dosages, frequencies, and schedules.
        4. Return a clean JSON object with the isPrescription flag and medicines array.
    `,
    tools: [ocrTool],
    outputType: PrescriptionSchema
});

export async function runImageExtraction(cloudinaryUrl) {
    // We send just the URL to the agent, keeping the context window tiny.
    const result = await run(imgAgent, `Extract data from this link: ${cloudinaryUrl}`);
    return result.finalOutput;
}