import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/** POST /api/auth/register — Customer self-registration */
router.post('/register', authController.register);

/** POST /api/auth/login — Login for all roles */
router.post('/login', authController.login);

/** GET  /api/auth/me — Get current user profile (protected) */
router.get('/me', protect, authController.getMe);

export default router;
