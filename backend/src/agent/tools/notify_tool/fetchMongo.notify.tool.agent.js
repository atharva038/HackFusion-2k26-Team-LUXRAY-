import { tool } from '@openai/agents'
import Prescription from '../../../models/prescription.model.js'
import {z} from 'zod'

export const fetchDosesTool = tool({
    name: 'get_active_prescriptions_data',
    description: 'Fetches approved and non-expired medication data from MongoDB.',
    parameters: z.object({
        currentTime: z.string().describe("The current time in HH:mm format")
    }),
    execute: async () => {
        try {
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

                            if (today <= expiryDate) {
                                activeMedications.push({
                                    user_email: doc.user.email,
                                    user_name: doc.user.name,
                                    medi_name: med.name,
                                    dosage: med.dosage,
                                    frequency: med.frequency,
                                    instructions: med.instructions,
                                    hospital: med.hospital_name,
                                    doctor: med.doctor_name,
                                    daysRemaining: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
                                });
                            } else {
                                console.log("no aproved prescriptions")
                            }
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