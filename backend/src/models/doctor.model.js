import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    doctor_name: {
        type: String,
        required: true,
    },
    hospital_name: {
        type: String,
        required: true,
    },
    license_id: {
        type: String,
        required: true,
        unique: true,
    },
    specialization: {
        type: String,
        required: true,
    },
    signatureSampleUrl: {
        type: String,
        required: true,
    },
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);
