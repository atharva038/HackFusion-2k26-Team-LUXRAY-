import Prescription from '../../../models/prescription.model.js';
import { tool } from '@openai/agents';
import { z } from 'zod';

export const fetchRefillsTool = tool({
    name: 'get_expiring_prescriptions',
    description: 'Finds medications that are about to run out (e.g., only 2 days left).',
    parameters: z.object({}),
    execute: async () => {
        const today = new Date();
        // 1. Only get approved prescriptions
        const records = await Prescription.find({ approved: true }).populate('user');
        const lowStock = [];

        for (const doc of records) {
            for (const p of doc.prescriptions) {
                // 2. Only check if the prescription is still Active
                if (p.isActive) {
                    p.extractedData.forEach(med => {
                        const start = new Date(p.startDate);
                        const duration = med.duration_days || 0;
                        const expiryDate = new Date(start);
                        expiryDate.setDate(start.getDate() + duration);

                        const diffTime = expiryDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // 3. Skip if expired (diffDays <= 0)
                        // 4. Only add to list if it's 1 or 2 days left
                        if (diffDays > 0 && diffDays <= 2) {
                            lowStock.push({
                                user_email: doc.user?.email,
                                user_name: doc.user?.name,
                                medicine_name: med.name || med.medi_name,
                                hospital: med.hospital_name || "Hospital",
                                daysLeft: diffDays
                            });
                        }
                    });
                }
            }
        }

        console.log("Current Low Stock found:", lowStock.length);
        return lowStock;
    }
});