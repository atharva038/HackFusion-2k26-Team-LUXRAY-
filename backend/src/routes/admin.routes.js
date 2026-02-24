const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

/** GET /api/admin/inventory — List all medicines */
router.get('/inventory', adminController.getInventory);

/** PUT /api/admin/inventory/:id — Update medicine stock */
router.put('/inventory/:id', adminController.updateInventory);

/** GET /api/admin/orders — List all orders */
router.get('/orders', adminController.getOrders);

/** PATCH /api/admin/orders/:id — Update order status */
router.patch('/orders/:id', adminController.updateOrderStatus);

/** GET /api/admin/refills — Get refill alerts */
router.get('/refills', adminController.getRefillAlerts);

/** GET /api/admin/traces — Get AI reasoning traces */
router.get('/traces', adminController.getTraces);

module.exports = router;
