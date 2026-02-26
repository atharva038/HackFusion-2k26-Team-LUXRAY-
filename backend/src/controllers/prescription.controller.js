import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { runImageExtraction } from '../agent/child/notify/img_data_extractor.notify.child.js';
import User from '../models/user.model.js'; // Ensure correct casing for your imports
import Prescription from '../models/prescription.model.js';
import { v2 as cloudinary } from 'cloudinary';

export const handlePrescriptionUpload = async (req, res) => {
    try {
        const userData = await User.findById(req.user.id);
        console.log("this is the userData in handlePerescriptionUpload", userData);
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
        console.log("this is image data extractor agent data: ", agentData);

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
            { user: req.user.id },
            {
                $push: {
                    prescriptions: {
                        imageUrl: imageUrl,
                        // doctor_name / hospital_name live inside each medicine entry per the OCR schema
                        extractedData: agentData.medicines.map(med => ({
                            doctor_name: med.doctor_name || "Unknown Doctor",
                            hospital_name: med.hospital_name || "General Hospital",
                            user_name: userName,
                            medi_name: med.medi_name || "Unknown medicine",
                            dosage: med.dosage,
                            frequency: med.frequency,
                            total_quantity: med.total_quantity,
                            duration_days: med.duration_days,
                            instructions: med.instructions || ""
                        })),
                        uploadedAt: new Date(),
                        startDate: new Date(),
                        isActive: true
                    }
                },
                $set: {
                    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    // Auto-approve: the OCR agent already confirmed this is a valid
                    // medical prescription. Admin can still review the order in the dashboard.
                    approved: true
                }
            },
            { upsert: true, new: true }
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

// Extractor function for getting Cloudinary public_id from secure_url
const extractCloudinaryPublicId = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1]; // e.g. "abcde12345.jpg"
    return lastPart.split('.')[0];
};

export const deletePrescription = async (req, res) => {
    try {
        const userId = req.user.id;
        const entryId = req.params.entryId;

        if (!entryId) {
            return res.status(400).json({ error: 'Missing prescription entry ID' });
        }

        // 1. Find the parent User Prescription document
        const rxDoc = await Prescription.findOne({ user: userId });
        if (!rxDoc) {
            return res.status(404).json({ error: 'No prescription records found for this user.' });
        }

        // 2. Find the specific nested entry
        const entry = rxDoc.prescriptions.id(entryId);
        if (!entry) {
            return res.status(404).json({ error: 'Prescription entry not found.' });
        }

        // 3. Delete from Cloudinary if an image URL exists
        if (entry.imageUrl) {
            try {
                const publicId = extractCloudinaryPublicId(entry.imageUrl);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`[Cloudinary] Deleted public_id: ${publicId}`);
                }
            } catch (cloudErr) {
                console.error('Cloudinary deletion failed:', cloudErr);
                // We don't block the database deletion if Cloudinary fails, 
                // but we log the error.
            }
        }

        // 4. Remove the entry from the array
        rxDoc.prescriptions.pull(entryId);
        
        // Disable the overall document approval if we just deleted the ONLY prescription or if we want it to default.
        // Easiest is to save it as is. If the array is empty, we can just leave it.
        await rxDoc.save();

        return res.status(200).json({ message: 'Prescription deleted successfully.' });

    } catch (error) {
        console.error('Error deleting prescription:', error);
        return res.status(500).json({
            error: 'Failed to delete prescription',
            details: error.message
        });
    }
};