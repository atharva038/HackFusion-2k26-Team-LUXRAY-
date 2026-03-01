import { tool } from '@openai/agents';
import { z } from 'zod';
import Doctor from "../../../models/doctor.model.js"

export const verifyPrescriptionTool = tool({
    name: "verify_prescription_credentials",
    description: "Checks if the extracted Doctor and Hospital exist as a valid pair in the database.",
    // REMOVED .trim() and .transform() from here
    parameters: z.object({
        extractedDr: z.string().min(2, "Doctor name is too short"),
        extractedHospital: z.string().min(2, "Hospital name is too short"),
        licenseId: z.string().describe("The doctor's license ID, or null if not found"),
    }),
    execute: async ({ extractedDr, extractedHospital, licenseId }) => {
        try {

            const dr = extractedDr.trim();
            const hospital = extractedHospital.trim();
            const license = licenseId?.trim();


            const validPair = await Doctor.findOne({
                doctor_name: { $regex: new RegExp(dr, "i") },
                hospital_name: { $regex: new RegExp(hospital, "i") }
            });

            if (!validPair) {
                return {
                    status: "REJECTED",
                    reason: `Validation Failed: No record of ${dr} working at ${hospital}.`
                };
            }


            if (license && validPair.license_id !== license) {
                return {
                    status: "REJECTED",
                    reason: "Validation Failed: License ID mismatch for this doctor."
                };
            }

            return {
                status: "VERIFIED",
                message: `Success: ${validPair.doctor_name} is a registered professional at ${validPair.hospital_name}.`,
                doctorId: validPair._id
            };
        } catch (error) {
            console.error("Verification Tool Error:", error.message);
            return { status: "ERROR", reason: "Database connection issue during verification." };
        }
    },
});