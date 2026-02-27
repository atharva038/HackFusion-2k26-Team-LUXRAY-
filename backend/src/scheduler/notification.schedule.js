import cron from 'node-cron';
import { run } from '@openai/agents';
import { notificationParentAgent } from '../agent/parent/parentNotify.agent.js';


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
    
    // for medication notify
    // every Minute (Demo) or Every Hour (Production)
    // cron.schedule('* * * * *', runMedicationCheck); 

    // for refill
    // runs once a day at 10:00 AM 
    // cron.schedule('0 10 * * *', runRefillCheck);

    // console.log(`[INFO] 🕒 Schedulers Active: Doses (Every Minute) | Refills (10:00 AM Daily)`);
}
// export function initNotificationScheduler() {
//     // Specific time
//     cron.schedule(`${targetMinute} ${targetHour} * * *`, runMedicationCheck);

//     // to run every minute
//     // cron.schedule('* * * * *', runMedicationCheck);

//     // to run every hour
//     // cron.schedule('0 * * * *', runMedicationCheck);

//     console.log(`[INFO] 🕒 Notification scheduler initialized. Target Demo Time: ${targetHour}:${String(targetMinute).padStart(2, '0')}`);
// }
