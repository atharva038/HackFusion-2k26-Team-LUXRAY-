import express from 'express';
const router = express.Router();
import * as chatController from '../controllers/chat.controller.js';

/** POST /api/chat — Send a message to the AI pharmacist */
router.post('/', chatController.handleMessage);

/** GET /api/chat/history — Retrieve chat history */
router.get('/history', chatController.getHistory);

export default router;
