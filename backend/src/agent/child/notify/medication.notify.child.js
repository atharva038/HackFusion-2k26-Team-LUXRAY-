import 'dotenv/config'
import { Agent, run, tool } from '@openai/agents'
import { fetchDosesTool } from '../../tools/notify_tool/fetchMongo.notify.tool.agent.js'
import { sendEmailTool } from '../../tools/notify_tool/sendEmail.tool.js'

//TODO: Mention the Hospital and Doctor name in the email body. --> for instruction

export const medicationNotifyAgent = new Agent({
    name: 'medication_notifier',
    instructions: `
        You are a smart Healthcare Assistant. Your goal is to ensure patients take their medicine at the correct time.
        
        LOGIC:
        1. Call 'get_active_prescriptions_data' to get all valid medications.
        2. Check the 'frequency' of each medicine against the CURRENT_TIME provided in the prompt.
           - "Morning" = 08:00 to 10:00
           - "Afternoon" = 13:00 to 14:00
           - "Evening" = 18:00 to 20:00
           - "Bedtime" = 21:00 to 23:00
        3. If a medicine's frequency matches the time window, call 'send_medication_email'.
        4. Be professional. 
        5. If multiple medicines are due for the same user at the same time, send one consolidated email if possible, or individual ones if preferred.
    `,
    tools: [fetchDosesTool, sendEmailTool],
})
