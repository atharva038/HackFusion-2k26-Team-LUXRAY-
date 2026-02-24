import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
    },

    changeType: {
      type: String,
      enum: ['deduct', 'restock'],
    },

    quantity: Number,

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  { timestamps: true }
);

export default mongoose.model('InventoryLog', inventoryLogSchema);
