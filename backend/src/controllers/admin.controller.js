import Medicine from '../models/medicine.model.js';
import Order from '../models/order.model.js';
import RefillAlert from '../models/refill.model.js';
import User from '../models/user.model.js';
import Prescription from '../models/prescription.model.js';
import logger from '../utils/logger.js';

/** List all medicines in inventory */
export const getInventory = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (err) {
    logger.error('Inventory fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

/** Update medicine stock by ID */
export const updateInventory = async (req, res) => {
  try {
    const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    logger.error('Inventory update error:', err);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
};

/** List all orders (populated with user and medicine refs) */
export const getOrders = async (req, res) => {
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
export const updateOrderStatus = async (req, res) => {
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
export const getRefillAlerts = async (req, res) => {
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
export const getTraces = async (req, res) => {
  // TODO: Persist AI traces in a dedicated model
  res.json({ traces: [] });
};
