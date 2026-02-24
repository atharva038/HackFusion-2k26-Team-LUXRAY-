import mongoose from 'mongoose';

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

    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age seems unrealistic'],
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },

  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
