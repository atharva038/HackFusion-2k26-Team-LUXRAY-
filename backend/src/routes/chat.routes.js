import express from 'express';
const router = express.Router();
import * as chatController from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, chatSchema } from '../middleware/validate.middleware.js';

/**
 * POST /api/chat
 * Send a message to the AI pharmacist.
 * Auth required. Zod validation on body.
 */
router.post('/', protect, validate(chatSchema), chatController.handleMessage);

/**
 * GET /api/chat/stream
 * SSE streaming endpoint — auth token must be passed as ?token= query param
 * since EventSource doesn't support custom headers.
 */
router.get('/stream', protect, chatController.handleStreamMessage);

/**
 * GET /api/chat/sessions
 * Retrieve all chat sessions for the current user.
 */
router.get('/sessions', protect, chatController.getSessions);

/**
 * GET /api/chat/history/:sessionId
 * Retrieve the message history for a specific session.
 */
router.get('/history/:sessionId', protect, chatController.getHistory);

/**
 * DELETE /api/chat/sessions/:sessionId
 * Delete a specific chat session.
 */
router.delete('/sessions/:sessionId', protect, chatController.deleteSession);

export default router;
