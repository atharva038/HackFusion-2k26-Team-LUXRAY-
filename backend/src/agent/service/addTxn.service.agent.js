import Order from "../../models/order.model.js";
import mongoose from "mongoose";

export async function addTransaction({
  patientId,
  medicineId,
  age,
  gender,
  purchaseDate,
  quantity,
  totalPrice,
  dosageFrequency,
  prescriptionRequired,
  prescriptionProof = "",
}) {
  try {
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return { error: "Invalid userId" };
    }

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      return { error: "Invalid medicineId" };
    }

    let status = "awaiting_payment";

    if (prescriptionRequired && !prescriptionProof) {
      status = "awaiting_prescription";
    }

    const order = new Order({
      user: patientId,
      age,
      gender,
      purchasingDate: purchaseDate || new Date(),

      prescription: prescriptionRequired,
      prescriptionProof: prescriptionProof || "",

      items: [
        {
          medicine: medicineId,
          dosage: dosageFrequency,
          quantity,
        },
      ],

      totalItems: quantity,
      totalAmount: totalPrice,
      status,
    });

    await order.save();

    return {
      message: "Order saved successfully",
      orderId: order._id,
      prescriptionRequired,
      prescriptionProofProvided: !!prescriptionProof,
      status: order.status,
    };
  } catch (error) {
    return { error: error.message };
  }
}
