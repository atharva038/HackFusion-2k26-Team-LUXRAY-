import mongoose from 'mongoose';


const medicineSchema = new mongoose.Schema({
  doctor_name: { type: String, required: true },
  hospital_name: { type: String, required: true },
  user_name: { type: String, required: true },
  medi_name: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  total_quantity: { type: Number },
  duration_days: { type: Number },
  instructions: { type: String }
});

const prescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    prescriptions: [
      {
        imageUrl: { type: String, required: true },
        extractedData: [medicineSchema],
        uploadedAt: { type: Date, default: Date.now },
        startDate: { type: Date, default: Date.now }, 
        isActive: { type: Boolean, default: true }
      }
    ],

    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
    },

    validUntil: Date,

    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Prescription', prescriptionSchema);
