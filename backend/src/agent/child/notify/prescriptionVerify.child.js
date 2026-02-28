import {Agent, tool, run} from '@openai/agents'
import {z} from 'zod'



export const verifyMedicineTool= tool({
    name: 'search_medicine_database',
    description: 'Searches for a medicine name to verify its existence and common usage.',
    parameters: z.object({
        medicineName: z.string(),
    }),
    execute: async ({ medicineName }) => {
        //TODO: user some medicine API to veriy the name of medicine from prescription
        console.log(`🔍 Validating: ${medicineName}...`);
        
        return { 
            found: true, 
            officialName: medicineName, 
            description: "Confirmed pharmaceutical product." 
        };
    }
})

export const validationAgent = new Agent({
    name: 'prescription_validator',
    instructions: `
        You are a Pharmaceutical Validator. 
        Your job is to check the 'medicine_name' extracted from a prescription.
        1. Use 'search_medicine_database' to verify if the name is a real medicine.
        2. If it is a typo (e.g., "Paracetamul"), suggest the correct spelling ("Paracetamol").
        3. If the name is completely fake or nonsensical, flag it as 'INVALID'.
        4. Return a JSON list of validated medicines.
    `,
    tools: [verifyMedicineTool],
})