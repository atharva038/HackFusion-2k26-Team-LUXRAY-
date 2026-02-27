import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

/** GET /api/user/orders — Paginated list of the logged-in user's orders */
router.get('/orders', userController.getMyOrders);

/** GET /api/user/prescriptions — All prescriptions for the logged-in user */
router.get('/prescriptions', userController.getMyPrescriptions);

export default router;
