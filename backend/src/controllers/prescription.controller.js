import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { runImageExtraction } from '../agent/child/notify/img_data_extractor.notify.child.js';
import User from '../models/user.model.js'; // Ensure correct casing for your imports
import Prescription from '../models/prescription.model.js';

export const handlePrescriptionUpload = async (req, res) => {
    try {
        const userData = await User.findById(req.user.id);
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userName = userData.name;
        const userEmail = userData.email;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 1. Upload the buffer to Cloudinary
        console.log("☁️ Uploading to Cloudinary...");
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
        const imageUrl = cloudinaryResult.secure_url;

        // 2. Pass the secure_url to your Agent
        console.log("🤖 Agent processing image URL:", imageUrl);
        const agentData = await runImageExtraction(imageUrl);

        // 2.5 Check if it's actually a prescription
        if (!agentData.isPrescription) {
            return res.status(200).json({
                success: false,
                isPrescription: false,
                message: agentData.rejection_reason || "This image does not appear to be a medical prescription.",
                imageUrl,
                medications: []
            });
        }

        // 3. Store prescriptionData on MongoDB
        console.log("💾 Saving to MongoDB...");

        const savedRecord = await Prescription.findOneAndUpdate(
            { user: req.user.id }, // Find the document for this user
            {
                $push: {
                    prescriptions: {
                        imageUrl: imageUrl,
                        // Mapping Agent data to your medicineSchema fields
                        extractedData: agentData.medicines.map(med => ({
                            doctor_name: med.doctor_name || "Unknown Doctor",
                            hospital_name: med.hospital_name || "General Hospital",
                            user_name: med.user_name || userName,
                            name: med.name || med.dosage,
                            dosage: med.dosage,
                            frequency: med.frequency,
                            total_quantity: med.total_quantity,
                            duration_days: med.duration_days,
                            instructions: med.instructions || ""
                        })),
                        uploadedAt: new Date(),
                        startDate: new Date(), // Explicitly setting for the Notification Agent
                        isActive: true
                    }
                },
                $set: {
                    // Setting a default validity for the whole document (e.g., 30 days)
                    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    approved: false
                }
            },
            { upsert: true, new: true } // Create if doesn't exist, return the new version
        );

        // 4. Final Response
        res.status(200).json({
            success: true,
            isPrescription: true,
            message: "Prescription processed and saved successfully",
            imageUrl,
            recordId: savedRecord._id,
            medications: agentData.medicines
        });

    } catch (error) {
        console.error("Internal Flow Error:", error);
        res.status(500).json({ error: error.message });
    }
};