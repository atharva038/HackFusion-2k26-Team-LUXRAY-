const Medicine = require('../models/medicine.model');
const Order = require('../models/order.model');
const RefillAlert = require('../models/refill.model');
const User = require('../models/user.model');
const Prescription = require('../models/prescription.model');
const logger = require('../utils/logger');

/** List all medicines in inventory */
exports.getInventory = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (err) {
    logger.error('Inventory fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

/** Update medicine stock by ID */
exports.updateInventory = async (req, res) => {
  try {
    const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    logger.error('Inventory update error:', err);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
};

/** List all orders (populated with user and medicine refs) */
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.medicine', 'name dosage')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    logger.error('Orders fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/** Update order status */
exports.updateOrderStatus = async (req, res) => {
  try {
    const updateData = { status: req.body.status };
    if (req.body.rejectionReason) updateData.rejectionReason = req.body.rejectionReason;
    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    logger.error('Order status update error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

/** Get refill alerts (populated with user and medicine names) */
exports.getRefillAlerts = async (req, res) => {
  try {
    const alerts = await RefillAlert.find({ status: 'active' })
      .populate('user', 'name')
      .populate('medicine', 'name dosage')
      .sort({ estimatedDepletionDate: 1 });
    res.json(alerts);
  } catch (err) {
    logger.error('Refill alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch refill alerts' });
  }
};

/** Get AI traces (placeholder) */
exports.getTraces = async (req, res) => {
  // TODO: Persist AI traces in a dedicated model
  res.json({ traces: [] });
};
