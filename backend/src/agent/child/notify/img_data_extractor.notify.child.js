import { z } from 'zod'
import { Agent, run } from '@openai/agents';
import { ocrTool } from '../../tools/notify_tool/OCR.notify.tool.agent.js';
import { verifyPrescriptionTool } from '../../tools/notify_tool/verifyPrescription.tool.js';

const PrescriptionSchema = z.object({
    isPrescription: z.boolean().describe("true if the image is a valid medical prescription, false otherwise"),
    rejection_reason: z.string().optional().describe("If isPrescription is false, explain why (e.g., 'This appears to be a grocery receipt, not a medical prescription')"),
    medicines: z.array(z.object({
        doctor_name: z.string(),
        hospital_name: z.string(),
        user_name: z.string(),
        medi_name: z.string().describe("name of the medicine"),
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
    ### ROLE:
    You are a Senior Medical Document Auditor. Your goal is to convert messy OCR text into structured, verified medical data.

    ### STEP 1: AUTHENTICITY GATEKEEPER
    Immediately set 'isPrescription' to FALSE and provide a 'rejection_reason' if:
    - The document lacks a clear Doctor's Name or Hospital/Clinic Letterhead.
    - The document is a billing receipt, a grocery list, or a non-medical photo.
    - The text is too garbled to identify at least one medication and its dosage.

    ### STEP 2: DATA EXTRACTION PROTOCOL
    If 'isPrescription' is TRUE, extract data with high precision:
    - **doctor_name**: Full name of the prescribing physician.
    - **hospital_name**: The specific Clinic or Hospital name from the header.
    - **user_name**: The patient's name as written on the document.
    - **medi_name**: The exact brand or generic name of the medicine.
    - **dosage**: The strength (e.g., "500mg", "10ml").
    - **frequency**: Convert symbols like "1-0-1" or "TDS" into human-readable schedules (e.g., "Morning and Night").
    - **total_quantity**: The specific number of tablets, capsules, or bottles prescribed (e.g., "15 tabs" = 15).
    - **duration_days**: Number of days the course lasts (e.g., "for 1 week" = 7).
    - **instructions**: Capture administration notes like "after food", "empty stomach", or "dilute in water".

    ### STEP 3: SANITIZATION & LOGIC
    - Fix OCR typos: Correct "l0mg" to "10mg", "0ne" to "1", or "Tdb" to "Tab".
    - If total_quantity isn't explicitly written, try to calculate it: (Frequency per day * Duration).
    - Return ONLY the JSON object defined by the Output Schema.
`,
    tools: [ocrTool, verifyPrescriptionTool],
    outputType: PrescriptionSchema
});

export async function runImageExtraction(cloudinaryUrl) {
    const result = await run(imgAgent, `Extract data from this link: ${cloudinaryUrl}`);
    return result;
}