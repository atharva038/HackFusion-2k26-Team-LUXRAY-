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
 * POST /api/chat/stream
 * SSE streaming endpoint — real token-by-token streaming via fetch + ReadableStream.
 * Auth via Authorization header (standard Bearer token).
 * Body: { message, sessionId?, language? } — same schema as POST /api/chat.
 */
router.post('/stream', protect, validate(chatSchema), chatController.handleStreamMessage);

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
