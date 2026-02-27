import Order from '../models/order.model.js';
import Prescription from '../models/prescription.model.js';

// GET /api/user/orders?page=1&limit=10
export const getMyOrders = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user.id })
        .populate('items.medicine', 'name price unitType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('MyOrders fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch your orders.' });
  }
};

// GET /api/user/prescriptions
export const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(prescriptions);
  } catch (err) {
    console.error('MyPrescriptions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch your prescriptions.' });
  }
};
