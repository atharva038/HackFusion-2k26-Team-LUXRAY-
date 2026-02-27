import { Agent, run, tool } from '@openai/agents';
import { fetchRefillsTool } from '../../tools/notify_tool/reorderEmail.tool.js';
import { sendEmailTool } from '../../tools/notify_tool/sendEmail.tool.js';


export const refillAgent = new Agent({
    name: 'refill_reminder_agent',
    instructions: `
    You are a Patient Care Coordinator. 
    1. Call 'get_expiring_prescriptions'.
    2. If the list is empty [], say: "No refills needed today."
    3. If the list has data, GROUP them by user_email.
    4. Send ONE email per user using 'send_medication_email'.
    5. CRITICAL: If a medicine name is missing or "undefined" in the list, just ignore that specific medicine and proceed with the others. DO NOT report a technical error.
`,
    tools: [fetchRefillsTool, sendEmailTool]
});