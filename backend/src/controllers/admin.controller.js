import Medicine from '../models/medicine.model.js';
import Order from '../models/order.model.js';
import RefillAlert from '../models/refill.model.js';
import User from '../models/user.model.js';
import Prescription from '../models/prescription.model.js';
import InventoryLog from '../models/inventoryLog.model.js';
import logger from '../utils/logger.js';
import { checkAndAlertLowStock } from '../scheduler/refill.scheduler.js';
import { sendLowStockAlert } from '../agent/service/email.service.agent.js';

// ─── Dashboard Stats ─────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ordersToday, pendingApprovals, lowStockCount, activeAlerts] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ['pending', 'awaiting_prescription'] } }),
      Medicine.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      RefillAlert.countDocuments({ status: 'active' }),
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.medicine', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({ ordersToday, pendingApprovals, lowStockCount, activeAlerts, recentOrders });
  } catch (err) {
    logger.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// ─── Inventory ───────────────────────────────────────────────
export const getInventory = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 }).lean();
    res.json(medicines);
  } catch (err) {
    logger.error('Inventory fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

export const updateInventory = async (req, res) => {
  try {
    // Only allow specific fields to be updated — never let req.body pass through directly
    const { price, description, lowStockThreshold, prescriptionRequired, unitType } = req.body;
    const allowedUpdates = {};
    if (price !== undefined) allowedUpdates.price = price;
    if (description !== undefined) allowedUpdates.description = description;
    if (lowStockThreshold !== undefined) allowedUpdates.lowStockThreshold = lowStockThreshold;
    if (prescriptionRequired !== undefined) allowedUpdates.prescriptionRequired = prescriptionRequired;
    if (unitType !== undefined) allowedUpdates.unitType = unitType;

    const updated = await Medicine.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Medicine not found' });
    res.json(updated);
  } catch (err) {
    logger.error('Inventory update error:', err);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
};

export const restockMedicine = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity === 0) {
      return res.status(400).json({ error: 'Valid quantity required' });
    }

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    const previousStock = medicine.stock;
    medicine.stock += quantity;
    if (medicine.stock < 0) medicine.stock = 0;
    await medicine.save();

    // Log the restock
    await InventoryLog.create({ medicine: medicine._id, changeType: 'restock', quantity });

    // Send immediate low stock alert if it crossed the threshold downward
    if (previousStock > medicine.lowStockThreshold && medicine.stock <= medicine.lowStockThreshold) {
      const pharmacists = await User.find({ role: { $in: ['admin', 'pharmacist'] } }).select('email').lean();
      const emails = pharmacists.map(u => u.email).filter(Boolean);
      if (emails.length > 0) {
        await sendLowStockAlert(emails, [medicine]);
        logger.info(`Immediate low stock alert sent for ${medicine.name}`);
      }
    }

    res.json(medicine);
  } catch (err) {
    logger.error('Restock error:', err);
    res.status(500).json({ error: 'Failed to restock' });
  }
};

// ─── Orders ──────────────────────────────────────────────────
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.medicine', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    logger.error('Orders fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const updateData = { status };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('user', 'name email')
      .populate('items.medicine', 'name');

    if (!updated) return res.status(404).json({ error: 'Order not found' });

    // If approved/dispatched, deduct stock and create inventory logs
    if (status === 'dispatched') {
      for (const item of updated.items) {
        await Medicine.findByIdAndUpdate(item.medicine._id || item.medicine, { $inc: { stock: -item.quantity } });
        await InventoryLog.create({
          medicine: item.medicine._id || item.medicine,
          changeType: 'deduct',
          quantity: item.quantity,
          order: updated._id,
        });
      }
    }

    res.json(updated);
  } catch (err) {
    logger.error('Order status update error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// ─── Prescriptions ───────────────────────────────────────────
export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('user', 'name email')
      .populate('medicine', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(prescriptions);
  } catch (err) {
    logger.error('Prescriptions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const updated = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('user', 'name email')
      .populate('medicine', 'name');
    if (!updated) return res.status(404).json({ error: 'Prescription not found' });
    res.json(updated);
  } catch (err) {
    logger.error('Prescription update error:', err);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
};

// ─── Refill Alerts ───────────────────────────────────────────
export const getRefillAlerts = async (req, res) => {
  try {
    const alerts = await RefillAlert.find()
      .populate('user', 'name email')
      .populate('medicine', 'name')
      .sort({ estimatedDepletionDate: 1 })
      .lean();
    res.json(alerts);
  } catch (err) {
    logger.error('Refill alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch refill alerts' });
  }
};

export const updateRefillAlert = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const updated = await RefillAlert.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('user', 'name email')
      .populate('medicine', 'name');
    if (!updated) return res.status(404).json({ error: 'Alert not found' });
    res.json(updated);
  } catch (err) {
    logger.error('Refill alert update error:', err);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

// ─── Inventory Logs ──────────────────────────────────────────
export const getInventoryLogs = async (req, res) => {
  try {
    const logs = await InventoryLog.find()
      .populate('medicine', 'name')
      .populate('order', 'status')
      .sort({ createdAt: -1 })
      .lean();
    res.json(logs);
  } catch (err) {
    logger.error('Inventory logs error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory logs' });
  }
};

// ─── Low-Stock Alert (manual trigger) ────────────────────────
export const triggerLowStockAlert = async (req, res) => {
  try {
    const result = await checkAndAlertLowStock();
    res.json({
      message: result.alerted === 0
        ? 'All medicines are above threshold — no alert sent.'
        : `Low-stock alert sent for ${result.alerted} medicine(s) to ${result.recipients} recipient(s).`,
      ...result,
    });
  } catch (err) {
    logger.error('Manual low-stock alert error:', err);
    res.status(500).json({ error: 'Failed to trigger low-stock alert' });
  }
};

// ─── AI Traces (placeholder) ─────────────────────────────────
export const getTraces = async (req, res) => {
  res.json({ traces: [] });
};
