const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
    },

    role: {
      type: String,
      enum: ['customer', 'admin', 'pharmacist'],
      default: 'customer',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
