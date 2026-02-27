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

