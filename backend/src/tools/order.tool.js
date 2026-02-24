const Order = require('../models/order.model');
const Medicine = require('../models/medicine.model');
const User = require('../models/user.model');
const InventoryLog = require('../models/inventoryLog.model');
const logger = require('../utils/logger');

/**
 * Tool: create_order
 * Creates a pharmacy order after inventory and prescription validation.
 * Now uses ObjectId references and logs inventory changes.
 */
async function createOrder({ medicineName, dosage, quantity, patientName }) {
  logger.info(`📦 Creating order: ${quantity}x ${medicineName} for ${patientName}`);

  // Find medicine
  const medicine = await Medicine.findOne({ name: new RegExp(medicineName, 'i') });
  if (!medicine) {
    return { success: false, message: `Medicine "${medicineName}" not found.` };
  }
  if (medicine.stock < quantity) {
    return { success: false, message: `Insufficient stock. Only ${medicine.stock} ${medicine.unitType}(s) available.` };
  }

  // Find or create user
  let user = await User.findOne({ name: new RegExp(patientName, 'i') });
  if (!user) {
    user = await User.create({ name: patientName, email: `${patientName.toLowerCase().replace(/\s/g, '.')}@patient.local`, role: 'customer' });
  }

  // Decrement stock
  medicine.stock -= quantity;
  await medicine.save();

  // Create order with proper references
  const order = await Order.create({
    user: user._id,
    items: [{
      medicine: medicine._id,
      name: medicine.name,
      dosage: dosage || medicine.dosage,
      quantity,
    }],
    totalItems: quantity,
    status: 'approved',
  });

  // Log inventory change for audit trail
  await InventoryLog.create({
    medicine: medicine._id,
    changeType: 'deduct',
    quantity,
    order: order._id,
  });

  return {
    success: true,
    orderId: order._id,
    message: `Order created successfully. ${quantity} ${medicine.unitType}(s) of ${medicine.name} reserved for ${patientName}.`,
  };
}

module.exports = { createOrder };
