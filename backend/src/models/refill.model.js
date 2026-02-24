const mongoose = require('mongoose');

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

module.exports = mongoose.model('RefillAlert', refillAlertSchema);
