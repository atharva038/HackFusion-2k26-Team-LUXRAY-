import Order from '../models/order.model.js';
import Prescription from '../models/prescription.model.js';
import User from '../models/user.model.js';

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

// GET /api/user/allergies
export const getMyAllergies = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('allergies').lean();
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ allergies: user.allergies || [] });
  } catch (err) {
    console.error('getMyAllergies error:', err);
    res.status(500).json({ error: 'Failed to fetch allergies.' });
  }
};

// PUT /api/user/allergies
// Body: { allergies: [{ allergen, severity, reaction }] }
export const updateMyAllergies = async (req, res) => {
  try {
    const { allergies } = req.body;
    if (!Array.isArray(allergies)) {
      return res.status(400).json({ error: '`allergies` must be an array.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { allergies } },
      { new: true, runValidators: true }
    ).select('allergies');

    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'Allergies updated successfully.', allergies: user.allergies });
  } catch (err) {
    console.error('updateMyAllergies error:', err);
    res.status(500).json({ error: 'Failed to update allergies.' });
  }
};
