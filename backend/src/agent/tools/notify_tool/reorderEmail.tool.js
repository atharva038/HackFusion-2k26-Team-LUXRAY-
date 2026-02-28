import Prescription from '../../../models/prescription.model.js';
import { tool } from '@openai/agents';
import { z } from 'zod';
import logger from '../../../utils/logger.js';

export const fetchRefillsTool = tool({
    name: 'get_expiring_prescriptions',
    description: 'Finds medications that are about to run out (e.g., only 2 days left).',
    parameters: z.object({}),
    execute: async () => {
        const today = new Date();
        // 1. Only get approved prescriptions, populate user for email
        const records = await Prescription.find({ approved: true }).populate('user');
        const lowStock = [];

        for (const doc of records) {
            for (const p of doc.prescriptions) {
                // 2. Only check active prescriptions
                if (!p.isActive) continue;

                for (const med of p.extractedData) {
                    // 3. Skip medicines with no name — prevent undefined in email
                    const medicineName = med.name || med.medi_name;
                    if (!medicineName) continue;

                    const start = new Date(p.startDate);
                    const duration = med.duration_days || 0;
                    const expiryDate = new Date(start);
                    expiryDate.setDate(start.getDate() + duration);

                    const diffTime = expiryDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // 4. Only alert if 1–2 days left (not expired)
                    if (diffDays > 0 && diffDays <= 2) {
                        lowStock.push({
                            user_email: doc.user?.email,
                            user_name: doc.user?.name,
                            medicine_name: medicineName,
                            dosage: med.dosage || med.strength || '',
                            hospital: med.hospital_name || 'your pharmacy',
                            daysLeft: diffDays,
                        });
                    }
                }
            }
        }

        logger.info(`[Refill] Found ${lowStock.length} prescription(s) expiring within 2 days.`);
        return lowStock;
    }
});