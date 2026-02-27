import { runImageExtraction } from "../agent/child/notify/img_data_extractor.notify.child.js";
import { medicationNotifyAgent } from "../agent/child/notify/medication.notify.child.js";
import { run } from '@openai/agents';
import { notificationParentAgent } from "../agent/parent/parentNotify.agent.js";
import { checkAndAlertLowStock } from "../scheduler/refill.scheduler.js";
import logger from "../utils/logger.js";

export const imgExtractionHandler = async (req, res) => {
    const { prescriptionUrl } = req.body;
    try {
        const result = await runImageExtraction(prescriptionUrl);
        console.log(result)
        res.json(result)
    } catch (error) {
        res.status(500).send(error.message);
    }
}

export const testEmail = async (req, res) => {
    try {
        const { testTime } = req.body;
        if (!testTime) return res.status(400).json({ error: "testTime is required (e.g. 08:30)" });
        const result = await run(medicationNotifyAgent, `The current time is ${testTime}. Run the notification logic.`);
        console.log("Agent Result:", result);
        res.json({
            success: true,
            message: `Agent triggered for time: ${testTime}`,
            details: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const testAgentSystem = async (req, res) => {
    try {
        const { task, testTime } = req.body;

        let prompt = "";
        if (task === "dose") {
            prompt = `The current time is ${testTime || '08:30'}. Use 'get_active_prescriptions_data' to find patients due for medicine now and send them a 'reminder' email.`;
        } else if (task === "refill") {
            prompt = `Perform a refill check. Use 'get_expiring_prescriptions' to find patients with <= 2 days left and send them a 'refill' alert.`;
        } else {
            return res.status(400).json({ error: "Please specify task as 'dose' or 'refill'" });
        }

        logger.info(`🚀 Manually testing ${task} flow...`);
        const result = await run(notificationParentAgent, prompt);
        logger.info("testAgentSystem result output:", result?.output);
        res.json({ success: true, agentResponse: result?.output ?? 'Agent completed (no text output)' });
    } catch (error) {
        logger.error("testAgentSystem error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Direct trigger for the admin/pharmacist low-stock alert.
 * Bypasses AI pipeline — calls the DB query + email directly.
 * POST /api/prescription/triggerLowStock
 */
export const triggerLowStockAlert = async (req, res) => {
    try {
        logger.info('🔔 Manual low-stock alert triggered by admin...');
        const result = await checkAndAlertLowStock();
        res.json({
            success: true,
            message: `Low-stock check complete.`,
            alerted: result.alerted,
            recipients: result.recipients,
            emailResult: result.emailResult ?? null,
        });
    } catch (error) {
        logger.error('triggerLowStockAlert error:', error.message);
        res.status(500).json({ error: error.message });
    }
};