import { tool } from '@openai/agents'
import Prescription from '../../../models/prescription.model.js'
import {z} from 'zod'

export const fetchDosesTool = tool({
    name: 'get_active_prescriptions_data',
    description: 'Fetches approved and non-expired medication data from MongoDB.',
    parameters: z.object({
        currentTime: z.string().describe("The current time in HH:mm format")
    }),
    execute: async ({ currentTime }) => {
        try {
            // Parse currentTime ("HH:mm") into total minutes for window comparison
            const [currentHour, currentMinute] = currentTime.split(':').map(Number);
            const currentTotalMinutes = currentHour * 60 + currentMinute;

            // Time windows defined in agent instructions
            const timeWindows = {
                Morning:   { start: 8 * 60,       end: 10 * 60 },
                Afternoon: { start: 13 * 60,       end: 14 * 60 },
                Evening:   { start: 18 * 60,       end: 20 * 60 },
                Bedtime:   { start: 21 * 60,       end: 23 * 60 },
            };

            // Determine which window is currently active
            const activeWindow = Object.entries(timeWindows).find(
                ([, { start, end }]) => currentTotalMinutes >= start && currentTotalMinutes <= end
            );

            // 1. Fetch all approved prescriptions and populate user details
            const records = await Prescription.find({ approved: true }).populate('user');

            const activeMedications = [];
            const today = new Date();

            records.forEach(doc => {
                doc.prescriptions.forEach(p => {
                    if (p.isActive) {
                        p.extractedData.forEach(med => {
                            const start = new Date(p.startDate);
                            const duration = med.duration_days || 0;
                            const expiryDate = new Date(start);
                            expiryDate.setDate(start.getDate() + duration);

                            if (today > expiryDate) return; // expired, skip

                            // Only include medicine if its frequency matches the current time window
                            if (activeWindow) {
                                const [windowName] = activeWindow;
                                const frequencyLower = (med.frequency || '').toLowerCase();
                                if (!frequencyLower.includes(windowName.toLowerCase())) return;
                            }

                            activeMedications.push({
                                user_email: doc.user.email,
                                user_name: doc.user.name,
                                medicine_name: med.medi_name,
                                dosage: med.dosage,
                                frequency: med.frequency,
                                instructions: med.instructions,
                                hospital: med.hospital_name,
                                doctor: med.doctor_name,
                                daysRemaining: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
                            });
                        });
                    }
                });
            });

            return activeMedications;
        } catch (error) {
            console.error("Error fetching doses:", error);
            return { error: "Could not retrieve data" };
        }
    },
});