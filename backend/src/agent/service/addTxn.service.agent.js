import Order from "../../models/order.model.js";
import mongoose from "mongoose";
import { isSocketInitialized, getIO } from "../../config/socket.js";

export async function addTransaction({
  patientId,
  items, // Expected array: [{ medicineId, quantity, dosageFrequency, totalPrice, prescriptionRequired, prescriptionProof }]
  age,
  gender,
  purchaseDate,
}) {
  try {
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return { error: "Invalid userId" };
    }

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.medicineId)) {
        return { error: `Invalid medicineId: ${item.medicineId}` };
      }
    }

    let globalStatus = "awaiting_payment";
    let totalAmount = 0;
    let totalItems = 0;

    const needsPrescription = items.some(i => i.prescriptionRequired && !i.prescriptionProof);
    if (needsPrescription) {
      globalStatus = "awaiting_prescription";
    }

    const orderItems = items.map(i => {
      totalAmount += i.totalPrice;
      totalItems += i.quantity;
      return {
        medicine: i.medicineId,
        dosage: i.dosageFrequency,
        quantity: i.quantity,
      };
    });

    const order = new Order({
      user: patientId,
      age,
      gender,
      purchasingDate: purchaseDate || new Date(),

      prescription: items.some(i => i.prescriptionRequired),
      prescriptionProof: items.find(i => i.prescriptionProof)?.prescriptionProof || "",

      items: orderItems,

      totalItems,
      totalAmount,
      status: globalStatus,
    });

    await order.save();

    // Emit real-time event so admin Orders page updates instantly
    if (isSocketInitialized()) {
      try {
        const populated = await Order.findById(order._id)
          .populate('user', 'name email')
          .populate('items.medicine', 'name')
          .lean();
        getIO().emit('order:new', populated);
      } catch (_) { /* non-fatal */ }
    }

    return {
      message: "Order saved successfully",
      orderId: order._id,
      prescriptionRequired: order.prescription,
      prescriptionProofProvided: !!order.prescriptionProof,
      status: order.status,
    };
  } catch (error) {
    return { error: error.message };
  }
}
