const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  dosage: {
      type: String,
    },
  quantity: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    age: {
      type: Number,
    },

    purchasingDate: {
      type: Date,
      default: Date.now,
    },

  

    prescription: {
      type: Boolean,
      default: false,
    },

    prescriptionProof: {
      type: String, // image URL
    },

    items: [orderItemSchema],

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'awaiting_prescription', 'dispatched'],
      default: 'pending',
    },

    totalItems: Number,
    totalAmount: Number,

    rejectionReason: String,

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

