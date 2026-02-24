import mongoose from 'mongoose';

const refillAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
    },

    lastOrderDate: Date,

    estimatedDepletionDate: Date,

    status: {
      type: String,
      enum: ['active', 'notified', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default mongoose.model('RefillAlert', refillAlertSchema);
