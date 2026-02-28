import Medicine from '../models/medicine.model.js';
import Order from '../models/order.model.js';
import RefillAlert from '../models/refill.model.js';
import User from '../models/user.model.js';
import Prescription from '../models/prescription.model.js';
import InventoryLog from '../models/inventoryLog.model.js';
import logger from '../utils/logger.js';
import { checkAndAlertLowStock } from '../scheduler/refill.scheduler.js';
import { sendLowStockAlert } from '../agent/service/email.service.agent.js';
import { emitToUser, isSocketInitialized, getIO } from '../config/socket.js';

import AgentAuditLog from '../models/agentAuditLog.model.js';

// ─── Dashboard Stats ─────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [
      ordersToday,
      pendingApprovals,
      lowStockCount,
      activeAlertsCount,
      recentOrders,
      systemActions,
      inventoryData,
      orderStatusCounts,
      dailyOrders,
      refillAlertsData,
      lowStockItemsData
    ] = await Promise.all([
      // Basic metrics
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ['pending', 'awaiting_prescription'] } }),
      Medicine.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      RefillAlert.countDocuments({ status: 'active' }),

      // Recent orders for the table
      Order.find()
        .populate('user', 'name email')
        .populate('items.medicine', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // System Actions (Agent calls in last 24h)
      AgentAuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),

      // Inventory Health (top 5 lowest stock relative to threshold)
      Medicine.aggregate([
        { $addFields: { healthScore: { $subtract: ['$stock', '$lowStockThreshold'] } } },
        { $sort: { healthScore: 1 } },
        { $limit: 5 },
        { $project: { _id: 1, name: 1, stock: 1, min: '$lowStockThreshold' } }
      ]),

      // Order Status Distribution (last 30 days)
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $cond: [
                { $in: ['$status', ['approved', 'dispatched', 'paid']] }, 'Approved',
                { $cond: [{ $in: ['$status', ['rejected', 'failed']] }, 'Rejected', 'Pending'] }
              ]
            },
            value: { $sum: 1 }
          }
        },
        { $project: { _id: 0, name: '$_id', value: 1 } }
      ]),

      // Order Trends (Last 7 Days)
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Refill Analytics Data
      RefillAlert.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Low Stock Table Data
      Medicine.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
        .sort({ stock: 1 })
        // Limit to 10 for the table
        .limit(10)
        .lean()
    ]);

    // Format Order Trends
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const orderTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyOrders.find(doItem => doItem._id === dateStr);
      orderTrends.push({
        name: daysMap[d.getUTCDay()],
        orders: match ? match.orders : 0
      });
    }

    // Format Refill Stats
    let totalRefills = 0;
    let completedRefills = 0;
    refillAlertsData.forEach(r => {
      totalRefills += r.count;
      if (r.status === 'completed') completedRefills += r.count;
    });
    // Fallback Mock Data for Most Common Recurring if none found
    const refillStats = {
      activeAlerts: activeAlertsCount,
      conversionRate: totalRefills > 0 ? Math.round((completedRefills / totalRefills) * 100) : 0,
      autoApprovals: Math.round(systemActions * 0.15) || 0, // estimate 15% of actions were auto-approvals
      topRecurring: { name: 'Metformin 500mg', mrr: '₹1,240' } // Keeping this one mock for now unless we aggregate top items
    };

    // Calculate Top Recurring Refill
    const topRefillMed = await RefillAlert.aggregate([
      { $group: { _id: '$medicine', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'medicines', localField: '_id', foreignField: '_id', as: 'medDetails' } },
      { $unwind: '$medDetails' }
    ]);

    if (topRefillMed.length > 0) {
      refillStats.topRecurring = {
        name: topRefillMed[0].medDetails.name,
        mrr: `₹${(topRefillMed[0].count * topRefillMed[0].medDetails.price).toLocaleString()}`
      };
    }

    // Format Low Stock Items
    const lowStockItems = lowStockItemsData.map(item => {
      // If stock is less than 50% of threshold, it's critical
      const isCritical = item.stock <= (item.lowStockThreshold / 2);
      return {
        id: item._id,
        // Shorten ID for display
        displayId: item.pzn || `MED-${item._id.toString().substring(18, 24).toUpperCase()}`,
        name: item.name,
        stock: item.stock,
        minRequired: item.lowStockThreshold,
        status: isCritical ? 'Critical' : 'Warning'
      };
    });

    // Approved Orders today count for KPI
    const approvedOrdersToday = await Order.countDocuments({
      createdAt: { $gte: today },
      status: { $in: ['approved', 'dispatched', 'paid'] }
    });

    res.json({
      ordersToday,
      approvedOrders: approvedOrdersToday,
      pendingApprovals,
      systemActions,
      inventoryHealth: inventoryData,
      orderStatusDistribution: orderStatusCounts.length ? orderStatusCounts : [
        { name: 'Approved', value: 0 }, { name: 'Pending', value: 0 }, { name: 'Rejected', value: 0 }
      ],
      orderTrends,
      refillStats,
      lowStockItems,
      recentOrders
    });
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

export const addMedicine = async (req, res) => {
  try {
    const { name, pzn, price, stock, unitType, description, prescriptionRequired, lowStockThreshold } = req.body;
    if (!name || !pzn || price === undefined || stock === undefined || !unitType) {
      return res.status(400).json({ error: 'name, pzn, price, stock, and unitType are required' });
    }
    const existing = await Medicine.findOne({ pzn: pzn.trim() });
    if (existing) return res.status(409).json({ error: `Medicine with PZN "${pzn}" already exists: ${existing.name}` });

    const medicine = await Medicine.create({
      name: name.trim(), pzn: pzn.trim(), price, stock,
      unitType, description: description || '',
      prescriptionRequired: prescriptionRequired ?? false,
      lowStockThreshold: lowStockThreshold ?? 10,
    });
    logger.info(`[Admin] New medicine added: ${medicine.name} (PZN: ${medicine.pzn}) by ${req.user?.id}`);
    res.status(201).json(medicine);
  } catch (err) {
    logger.error('Add medicine error:', err);
    res.status(500).json({ error: 'Failed to add medicine' });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    logger.info(`[Admin] Medicine removed: ${medicine.name} (PZN: ${medicine.pzn}) by ${req.user?.id}`);
    res.json({ message: `"${medicine.name}" removed from inventory.`, id: req.params.id });
  } catch (err) {
    logger.error('Delete medicine error:', err);
    res.status(500).json({ error: 'Failed to delete medicine' });
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

    if (isSocketInitialized()) {
      getIO().emit('inventory:medicine-updated', { medicine: updated });
    }

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
      if (isSocketInitialized()) {
        getIO().emit('inventory:low-stock-alert', {
          medicine: { name: medicine.name, stock: medicine.stock, lowStockThreshold: medicine.lowStockThreshold },
        });
      }
    }

    if (isSocketInitialized()) {
      getIO().emit('inventory:medicine-restocked', {
        medicine: {
          name: medicine.name,
          previousStock,
          newStock: medicine.stock,
          quantityAdded: quantity,
        },
      });
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

    // ── Real-time socket events ──────────────────────────────────
    if (isSocketInitialized()) {
      const userId = updated.user?._id?.toString() ?? updated.user?.toString();
      const orderId = updated._id.toString();

      // Notify the customer who placed the order
      if (userId) {
        emitToUser(userId, 'order:status-updated', {
          orderId,
          status: updated.status,
          rejectionReason: updated.rejectionReason,
          approvedBy: updated.approvedBy?.toString?.(),
          totalAmount: updated.totalAmount,
        });

        if (status === 'dispatched') {
          emitToUser(userId, 'order:dispatched', {
            orderId,
            message: 'Your order has been dispatched!',
          });
        }

        if (status === 'rejected') {
          emitToUser(userId, 'order:rejected', {
            orderId,
            reason: updated.rejectionReason || 'Your order has been rejected.',
          });
        }
      }

      // Broadcast to all admins/pharmacists so their Orders table updates
      getIO().emit('order:admin-updated', {
        orderId,
        status: updated.status,
        userName: updated.user?.name,
        rejectionReason: updated.rejectionReason,
        approvedBy: updated.approvedBy?.toString?.(),
        totalAmount: updated.totalAmount,
      });
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

    if (isSocketInitialized()) {
      const userId = updated.user?._id?.toString() ?? updated.user?.toString();
      const medicineName = updated.medicine?.name ?? 'medicine';
      const payload = {
        prescriptionId: updated._id.toString(),
        status: updated.approved ? 'approved' : 'rejected',
        medicine: medicineName,
        userName: updated.user?.name,
      };
      // Notify the customer
      if (userId) emitToUser(userId, 'prescription:updated', payload);
      // Broadcast to all admins
      getIO().emit('prescription:admin-updated', payload);
    }

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

    if (isSocketInitialized()) {
      const userId = updated.user?._id?.toString() ?? updated.user?.toString();
      const payload = {
        alertId: updated._id.toString(),
        status: updated.status,
        medicine: updated.medicine?.name,
        userName: updated.user?.name,
      };
      if (userId) emitToUser(userId, 'refill:alert-updated', payload);
      getIO().emit('refill:admin-updated', payload);
    }

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

    if (isSocketInitialized() && result.alerted > 0) {
      getIO().emit('inventory:low-stock-manual-alert', {
        alertedCount: result.alerted,
        recipients: result.recipients,
      });
    }

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
