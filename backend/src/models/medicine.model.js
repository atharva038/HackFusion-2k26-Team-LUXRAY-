import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },

    pzn: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    unitType: {
      type: String,
      enum: ["tablet", "strip", "bottle", "injection"],
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
  { timestamps: true },
);

export default mongoose.model("Medicine", medicineSchema);
