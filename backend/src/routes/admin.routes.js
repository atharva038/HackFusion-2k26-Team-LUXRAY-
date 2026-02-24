import express from 'express';
const router = express.Router();
import * as adminController from '../controllers/admin.controller.js';

/** GET  /api/admin/stats — Dashboard summary statistics */
router.get('/stats', adminController.getDashboardStats);

/** GET  /api/admin/inventory — List all medicines */
router.get('/inventory', adminController.getInventory);

/** PUT  /api/admin/inventory/:id — Update medicine fields */
router.put('/inventory/:id', adminController.updateInventory);

/** POST /api/admin/inventory/:id/restock — Restock a medicine */
router.post('/inventory/:id/restock', adminController.restockMedicine);

/** GET  /api/admin/orders — List all orders */
router.get('/orders', adminController.getOrders);

/** PATCH /api/admin/orders/:id — Update order status */
router.patch('/orders/:id', adminController.updateOrderStatus);

/** GET  /api/admin/prescriptions — List all prescriptions */
router.get('/prescriptions', adminController.getPrescriptions);

/** PATCH /api/admin/prescriptions/:id — Approve/reject prescription */
router.patch('/prescriptions/:id', adminController.updatePrescription);

/** GET  /api/admin/refills — Get refill alerts */
router.get('/refills', adminController.getRefillAlerts);

/** PATCH /api/admin/refills/:id — Update refill alert status */
router.patch('/refills/:id', adminController.updateRefillAlert);

/** GET  /api/admin/logs — Get inventory logs */
router.get('/logs', adminController.getInventoryLogs);

/** GET  /api/admin/traces — Get AI reasoning traces */
router.get('/traces', adminController.getTraces);

export default router;
