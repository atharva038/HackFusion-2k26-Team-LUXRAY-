import { runImageExtraction } from "../agent/child/notify/img_data_extractor.notify.child.js";
import { medicationNotifyAgent } from "../agent/child/notify/medication.notify.child.js";
import { run } from '@openai/agents'

export const imgExtractionHandler = async (req, res) => {
    const { prescriptionUrl } = req.body;

    try {
        const result = await runImageExtraction(prescriptionUrl);
        console.log(result)
        res.json(result)
    } catch (error) {
        res.status(500).send(err.message);
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
            details: result // This will show you if the agent called the tools or not
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}