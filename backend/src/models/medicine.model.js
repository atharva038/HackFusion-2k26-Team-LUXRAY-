const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },

    dosage: {
      type: String,
      required: true,
    },

    unitType: {
      type: String,
      enum: ['tablet', 'strip', 'bottle', 'injection'],
      required: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    prescriptionRequired: {
      type: Boolean,
      default: false,
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
