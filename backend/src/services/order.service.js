const Order = require('../models/order.model');

/**
 * Business logic for order operations.
 */
const orderService = {
  async getAll() {
    return Order.find().sort({ createdAt: -1 });
  },

  async create(data) {
    return Order.create(data);
  },

  async updateStatus(orderId, status) {
    return Order.findByIdAndUpdate(orderId, { status }, { new: true });
  },
};

module.exports = orderService;
