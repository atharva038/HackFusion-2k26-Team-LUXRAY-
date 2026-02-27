import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
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
      ref: "User",
      required: true,
    },

    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
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
      type: String,
      default: "", // important
    },

    items: [orderItemSchema],

    status: {
      type: String,
      enum: [
        "pending",
        "awaiting_payment",
        "paid",
        "approved",
        "rejected",
        "awaiting_prescription",
        "dispatched",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    invoiceId: String,

    totalItems: Number,
    totalAmount: Number,

    rejectionReason: String,

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
