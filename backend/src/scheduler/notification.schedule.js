import cron from 'node-cron';
import { run } from '@openai/agents';
import { medicationNotifyAgent } from '../agent/child/notify/medication.notify.child.js';

// --- CONFIGURATION ---
const targetHour = 8;    // Set your demo hour (0-23)
const targetMinute = 30; // Set your demo minute (0-59)

const runMedicationCheck = async () => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" +
                        now.getMinutes().toString().padStart(2, '0');

    console.log(`[${new Date().toISOString()}] ⏰ Cron Trigger: Running Agent for ${currentTime}`);

    try {
        await run(medicationNotifyAgent,
            `The current time is ${currentTime}.
             Step 1: Fetch active prescriptions.
             Step 2: Identify users who need to take medicine right now based on frequency.
             Step 3: Send them a reminder email.`
        );
        console.log("✅ Medication Agent run successful.");
    } catch (error) {
        console.error("❌ Cron Agent Error:", error);
    }
};

/**
 * Initialize medication notification scheduler.
 * Call this after the DB connection is established.
 *
 * OPTION 1: SPECIFIC TIME (Best for demonstrating a single event)
 * OPTION 2: EVERY MINUTE — uncomment for instant demo testing
 * OPTION 3: EVERY HOUR  — uncomment for production
 */
export function initNotificationScheduler() {
    // OPTION 1: Specific time
    cron.schedule(`${targetMinute} ${targetHour} * * *`, runMedicationCheck);

    // OPTION 2: Every minute (demo)
    // cron.schedule('* * * * *', runMedicationCheck);

    // OPTION 3: Every hour (production)
    // cron.schedule('0 * * * *', runMedicationCheck);

    console.log(`[INFO] 🕒 Notification scheduler initialized. Target Demo Time: ${targetHour}:${String(targetMinute).padStart(2, '0')}`);
}
