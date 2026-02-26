import mongoose from "mongoose";
import Medicine from "../../models/medicine.model.js";

export async function reduceQuantity({
  medicineId,
  medicineName,
  pzn,
  quantity,
}) {
  try {
    let query = {};

    if (medicineId) {
      if (!mongoose.Types.ObjectId.isValid(medicineId)) {
        return { error: "Invalid medicineId" };
      }
      query._id = medicineId;
    } else if (pzn) {
      query.pzn = pzn;
    } else if (medicineName) {
      query.name = { $regex: medicineName, $options: "i" };
    } else {
      return { error: "Provide medicineId, pzn, or medicineName" };
    }

    // Reduce only if enough stock exists
    const medicine = await Medicine.findOneAndUpdate(
      { ...query, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true },
    );

    if (!medicine) {
      return { error: "Medicine not found or insufficient stock" };
    }

    return {
      message: "Stock reduced successfully",
      medicineId: medicine._id,
      medicineName: medicine.name,
      remainingStock: medicine.stock,
      lowStockWarning:
        medicine.stock <= medicine.lowStockThreshold
          ? "Low stock warning"
          : null,
    };
  } catch (error) {
    return { error: error.message };
  }
}
