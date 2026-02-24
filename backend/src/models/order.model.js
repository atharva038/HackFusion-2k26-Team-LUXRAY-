const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },

  name: String,
  dosage: String,

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

    items: [orderItemSchema],

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'awaiting_prescription', 'dispatched'],
      default: 'pending',
    },

    totalItems: Number,

    rejectionReason: String,

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
