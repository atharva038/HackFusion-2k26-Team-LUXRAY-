import { Agent, run, tool } from '@openai/agents';
import { fetchRefillsTool } from '../../tools/notify_tool/reorderEmail.tool.js';
import { sendEmailTool } from '../../tools/notify_tool/sendEmail.tool.js';


export const refillAgent = new Agent({
    name: 'refill_reminder_agent',
    instructions: `
    You are a Patient Care Coordinator.
    
    WORKFLOW:
    1. Call 'get_expiring_prescriptions' to get the list.
    2. If the list is empty [], respond: "No refills needed today."
    3. GROUP results by user_email.
    4. For each unique user, send ONE 'refill' email using 'send_medication_email'.
       - Set messageType to 'refill'
       - Pass medicine_name as medicineName
       - Pass dosage from the record (empty string if missing)
       - Pass hospital from the record (empty string if missing)
       - Pass daysLeft from the record (integer, 1 or 2)
    5. If a record has no user_email, skip it silently.
    6. Do NOT invent or hallucinate any medicine names or patient data.
    `,
    tools: [fetchRefillsTool, sendEmailTool]
});