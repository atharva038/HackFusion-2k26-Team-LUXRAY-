import cron from 'node-cron';
import { run } from '@openai/agents';
import { notificationParentAgent } from '../agent/parent/parentNotify.agent.js';
import logger from '../utils/logger.js';


const targetHour = 8;
const targetMinute = 30;

const runMedicationCheck = async () => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" +
        now.getMinutes().toString().padStart(2, '0');

    console.log(`[${new Date().toISOString()}] ⏰ Dose Cron: Checking reminders for ${currentTime}`);

    try {
        await run(notificationParentAgent,
            `The current time is ${currentTime}. 
             Use 'get_active_prescriptions_data' to find patients due for medicine now and send them a 'reminder' email.`
        );
        // ///////////////////////
        // MONITOR PHASE 
        // ///////////////////////
        const monitorTraces = result.state._generatedItems.map((item) => {
            const actor = item.agent?.name || item.targetAgent?.name || "System";
            const itemType = item.type || item.constructor.name;
            let actionName = "Reasoning";
            let detailData = "Processing...";

            if (item.rawItem?.type === 'function_call') {
                actionName = item.rawItem.name.includes('transfer') ? "🤝 Handoff" : `⚙️ Tool: ${item.rawItem.name}`;
                detailData = item.rawItem.arguments;
            } else if (item.rawItem?.type === 'function_call_result' || item.rawItem?.type === 'function_output') {
                actionName = `✅ Result: ${item.rawItem.name}`;
                detailData = item.rawItem.output?.text || item.rawItem.output || "Success";
            } else if (itemType === 'message_output_item' || item.rawItem?.type === 'message') {
                actionName = "💬 Final Log";
                detailData = item.rawItem?.content?.[0]?.text || item.content || "...";
            }
            return { agent: actor, action: actionName, data: detailData };
        }).filter(t => t.action !== "Reasoning");

        console.log(`\n📍 --- DOSE CRON TRACE (${currentTime}) ---`);
        monitorTraces.forEach((t, i) => {
            const shortData = typeof t.data === 'string' ? (t.data.substring(0, 80) + "...") : JSON.stringify(t.data);
            console.log(`[${i}] ${t.agent.padEnd(15)} ➔ ${t.action}\n    └─ Result: ${shortData}`);
        });
        console.log("------------------------------------------\n");
        console.log("✅ Dose Reminder run successful.");
    } catch (error) {
        console.error("❌ Dose Cron Error:", error);
    }
};


const runRefillCheck = async () => {
    console.log(`[${new Date().toISOString()}] 📉 Refill Cron: Checking for low stock...`);

    try {
        await run(notificationParentAgent,
            `Perform a refill check. 
             Use 'get_expiring_prescriptions' to find patients with <= 2 days left and send them a 'refill' alert.`
        );
        // ///////////////////////
        // MONITOR PHASE 
        // ///////////////////////
        const monitorTraces = result.state._generatedItems.map((item) => {
            const actor = item.agent?.name || item.targetAgent?.name || "System";
            const itemType = item.type || item.constructor.name;
            let actionName = "Reasoning";
            let detailData = "Processing...";

            if (item.rawItem?.type === 'function_call') {
                actionName = item.rawItem.name.includes('transfer') ? "🤝 Handoff" : `⚙️ Tool: ${item.rawItem.name}`;
                detailData = item.rawItem.arguments;
            } else if (item.rawItem?.type === 'function_call_result' || item.rawItem?.type === 'function_output') {
                actionName = `✅ Result: ${item.rawItem.name}`;
                detailData = item.rawItem.output?.text || item.rawItem.output || "Success";
            } else if (itemType === 'message_output_item' || item.rawItem?.type === 'message') {
                actionName = "💬 Final Log";
                detailData = item.rawItem?.content?.[0]?.text || item.content || "...";
            }
            return { agent: actor, action: actionName, data: detailData };
        }).filter(t => t.action !== "Reasoning");

        console.log(`\n📍 --- REFILL CRON TRACE ---`);
        monitorTraces.forEach((t, i) => {
            const shortData = typeof t.data === 'string' ? (t.data.substring(0, 80) + "...") : JSON.stringify(t.data);
            console.log(`[${i}] ${t.agent.padEnd(15)} ➔ ${t.action}\n    └─ Result: ${shortData}`);
        });
        console.log("----------------------------\n");
        console.log("✅ Refill Alert run successful.");
    } catch (error) {
        console.error("❌ Refill Cron Error:", error);
    }
};


export function initNotificationScheduler() {
    // Dose reminder: daily at 8:00 AM
    cron.schedule('0 8 * * *', runMedicationCheck);

    // Refill check: daily at 10:00 AM
    cron.schedule('0 10 * * *', runRefillCheck);

    logger.info('🕒 Notification schedulers initialized: Doses @ 08:00 | Refills @ 10:00 (daily)');
}

