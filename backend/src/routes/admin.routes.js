import express from 'express';
const router = express.Router();
import * as adminController from '../controllers/admin.controller.js';
import * as pharmacistAgentController from '../controllers/pharmacistAgent.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { createRedisRateLimiter } from '../middleware/redisRateLimiter.js';
import { validate, chatSchema } from '../middleware/validate.middleware.js';
import multer from 'multer';

// Set up multer for memory storage (for Excel buffers)
const upload = multer({ storage: multer.memoryStorage() });

// All admin routes require a valid JWT and admin/pharmacist role
router.use(protect, restrictTo('admin', 'pharmacist'));

// Rate limiter for pharmacist agent (10 req/min per user)
const pharmacistAgentLimiter = createRedisRateLimiter({
  prefix: 'pharmacist-agent',
  max: 10,
  windowMs: 60 * 1000,
});

/** GET  /api/admin/stats — Dashboard summary statistics */
router.get('/stats', adminController.getDashboardStats);

/** GET  /api/admin/inventory — List all medicines */
router.get('/inventory', adminController.getInventory);

/** POST /api/admin/medicines — Add a brand-new medicine */
router.post('/medicines', adminController.addMedicine);

/** DELETE /api/admin/medicines/:id — Remove a medicine permanently */
router.delete('/medicines/:id', adminController.deleteMedicine);

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

/** POST /api/admin/low-stock-alert — Manually trigger low-stock email to pharmacists */
router.post('/low-stock-alert', adminController.triggerLowStockAlert);

/** GET  /api/admin/traces — Get AI reasoning traces */
router.get('/traces', adminController.getTraces);

// ─── Excel Import/Export Routes ──────────────────────────────────────────
/** POST /api/admin/medicines/import — Import medicines from Excel (AI mapping) */
router.post('/medicines/import', upload.single('file'), adminController.importMedicinesExcel);

/** GET /api/admin/medicines/export — Export medicines to Excel */
router.get('/medicines/export', adminController.exportMedicinesExcel);

/** GET /api/admin/orders/export — Export orders to Excel */
router.get('/orders/export', adminController.exportOrdersExcel);

// ─── Pharmacist AI Agent Routes ────────────────────────────────────────────
/** POST /api/admin/agent/chat — Sync pharmacist agent message */
router.post('/agent/chat', pharmacistAgentLimiter, validate(chatSchema), pharmacistAgentController.handlePharmacistMessage);

/** POST /api/admin/agent/chat/stream — SSE streaming pharmacist agent */
router.post('/agent/chat/stream', pharmacistAgentLimiter, validate(chatSchema), pharmacistAgentController.handlePharmacistStream);

/** GET  /api/admin/agent/sessions — List pharmacist agent sessions */
router.get('/agent/sessions', pharmacistAgentController.getPharmacistSessions);

/** GET  /api/admin/agent/history/:sessionId — Session message history */
router.get('/agent/history/:sessionId', pharmacistAgentController.getPharmacistHistory);

/** DELETE /api/admin/agent/sessions/:sessionId — Delete a session */
router.delete('/agent/sessions/:sessionId', pharmacistAgentController.deletePharmacistSession);

export default router;
