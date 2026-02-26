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

// --- CRON SCHEDULES ---

/**
 * OPTION 1: SPECIFIC TIME (Best for demonstrating a single event)
 * Runs exactly at the hour and minute defined above.
 */
cron.schedule(`${targetMinute} ${targetHour} * * *`, runMedicationCheck);

/**
 * OPTION 2: EVERY MINUTE (Best for showing logic works instantly)
 */
// cron.schedule('* * * * *', runMedicationCheck);

/**
 * OPTION 3: EVERY HOUR (Production standard)
 */
// cron.schedule('0 * * * *', runMedicationCheck);

console.log(`[INFO] 🕒 Scheduler initialized. Target Demo Time: ${targetHour}:${targetMinute}`);