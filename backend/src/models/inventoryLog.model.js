import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },

    changeType: {
      type: String,
      enum: ['deduct', 'restock'],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  { timestamps: true }
);

export default mongoose.model('InventoryLog', inventoryLogSchema);
