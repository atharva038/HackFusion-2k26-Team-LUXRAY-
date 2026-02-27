import {Agent, run, tool} from '@openai/agents';
import { medicationNotifyAgent } from '../child/notify/medication.notify.child.js';
import { refillAgent } from '../child/notify/reorderEmailAgent.notify.child.js';

export const notificationParentAgent = new Agent({
    name: 'notification_dispatcher',
    instructions: `
        You are the Chief Health Coordinator. Your job is to route notification tasks to the correct department.
        
        - If the request is about checking daily medicine doses or current time reminders, HANDOFF to the 'medication_notifier'.
        - If the request is about checking stock levels, expiring prescriptions, or reorders, HANDOFF to the 'refill_reminder_agent'.
        
        Always be professional and ensure the correct agent handles the medical data.
    `,
    handoffs: [medicationNotifyAgent, refillAgent]
})