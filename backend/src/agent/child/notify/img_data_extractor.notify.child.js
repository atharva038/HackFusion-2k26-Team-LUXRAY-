import {z} from 'zod'
import { Agent, run } from '@openai/agents';
import { ocrTool } from '../../tools/notify_tool/OCR.notify.tool.agent.js';

const PrescriptionSchema = z.object({
    medicines: z.array(z.object({
        doctor_name: z.string(),
        hospital_name: z.string(),
        user_name: z.string(),
        dosage: z.string(),
        frequency: z.string().describe("e.g., '8am and 8pm' or '1-0-1'"),
        total_quantity: z.number().optional().describe("Total number of pills/units prescribed"),
        duration_days: z.number().optional().describe("Number of days to take the medicine"),
        instructions: z.string().optional().describe("e.g., 'after food'")
    }))
});

export const imgAgent = new Agent({
    name: 'image_data_extraction',
    instructions: `
        You are a medical data agent. 
        1. Use the extract_text_from_url tool with the provided Cloudinary link.
        2. Extract medication names, dosages, and schedules.
        3. Return a clean JSON object.
    `,
    tools: [ocrTool],
    outputType: PrescriptionSchema
});

export async function runImageExtraction(cloudinaryUrl) {
    // We send just the URL to the agent, keeping the context window tiny.
    const result = await run(imgAgent, `Extract data from this link: ${cloudinaryUrl}`);
    return result.finalOutput;
}