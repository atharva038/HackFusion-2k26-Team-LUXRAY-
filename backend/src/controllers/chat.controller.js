import logger from "../utils/logger.js";
import { runChatAgent } from "../agent/service/chat.agent.service.js";
import ChatSession from "../models/chatSession.model.js";
// Implied translations natively supported by the agent SDK
import { getSessionHistory, appendSessionMessages } from "../services/cache.service.js";
import { streamAgentResponse, prepareAgentMessages } from "../services/streamService.js";

/**
 * handleMessage — POST /api/chat
 * Receives a user message, runs it through the agent service,
 * persists both turns to MongoDB, and returns the AI reply.
 */
export const handleMessage = async (req, res) => {
  try {
    const { message, sessionId: reqSessionId, language = 'en', imageUrl } = req.body; // Already validated & sanitised by Zod middleware
    const userId = req.user.id;

    logger.info(`[Chat] User [${userId}] (${language}) → "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`);

    let session;
    let sessionId;
    let history = [];
    let redisHistory = null;

    if (reqSessionId) {
      sessionId = reqSessionId;
      // Fetch DB and Redis perfectly in parallel
      const [dbSession, cachedHistory] = await Promise.all([
        ChatSession.findOne({ _id: sessionId, user: userId }).select('_id messages').lean(),
        getSessionHistory(sessionId)
      ]);
      if (!dbSession) return res.status(404).json({ error: "Session not found." });
      session = dbSession;
      history = session.messages || [];
      redisHistory = cachedHistory;
    } else {
      const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
      const newSession = await ChatSession.create({ user: userId, title, messages: [] });
      session = newSession.toObject();
      sessionId = session._id.toString();
      history = [];
    }

    const agentHistory = redisHistory || history;

    // Run through the agent service (handles injection guard + audit log)
    const { reply, blocked, durationMs } = await runChatAgent({
      userId,
      sessionId,
      message: message.trim(), // Raw user message
      history: agentHistory,
    });

    // Persist both turns ──────────────────────────────────────────────────
    const newMessages = [
      { role: 'user', content: message, ...(imageUrl ? { imageUrl } : {}) },
      { role: 'ai', content: reply },
    ];

    // Redis session (fast, temporary)
    appendSessionMessages(sessionId, newMessages);

    // MongoDB (persistent)
    await ChatSession.findByIdAndUpdate(
      sessionId,
      { $push: { messages: { $each: newMessages } } }
    );

    logger.info(`[Chat] Agent replied natively in ${durationMs}ms for user [${userId}]${blocked ? ' [BLOCKED]' : ''}`);

    res.json({ text: reply, blocked, sessionId, language });
  } catch (err) {
    logger.error("[Chat] handleMessage error:", err);
    res.status(500).json({ error: "AI agent is temporarily unavailable. Please try again." });
  }
};

/**
 * handleStreamMessage — POST /api/chat/stream
 * SSE streaming endpoint — real token-by-token streaming from the OpenAI Agents SDK.
 *
 * Multilingual flow:
 *   1. Translate user input to English (non-streamed, cached)
 *   2. Stream agent English response in real-time (English users see it live)
 *   3. Collect authoritative finalOutput
 *   4. Translate final output to target language (non-streamed, cached)
 *   5. For non-English: stream translated words progressively
 *   6. Persist user + AI messages to Redis + MongoDB ONLY after completion
 *
 * Falls back to runChatAgent() if real streaming fails.
 */
export const handleStreamMessage = async (req, res) => {
  try {
    const { message, sessionId: reqSessionId, language = 'en', imageUrl } = req.body;
    const userId = req.user.id;

    logger.info(`[Chat-Stream] User [${userId}] (${language}) → "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`);

    // ── Session Lookup / Creation ────────────────────────────────────────
    let session, sessionId;
    let history = [];
    let redisHistory = null;

    if (reqSessionId) {
      sessionId = reqSessionId;
      // Fetch DB and Redis perfectly in parallel
      const [dbSession, cachedHistory] = await Promise.all([
        ChatSession.findOne({ _id: sessionId, user: userId }).select('_id messages').lean(),
        getSessionHistory(sessionId)
      ]);
      if (!dbSession) return res.status(404).json({ error: "Session not found." });
      session = dbSession;
      history = session.messages || [];
      redisHistory = cachedHistory;
    } else {
      const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
      const newSession = await ChatSession.create({ user: userId, title, messages: [] });
      session = newSession.toObject();
      sessionId = session._id.toString();
      history = [];
    }

    // ── Session Memory: try Redis first, fall back to MongoDB ────────────
    const agentHistory = redisHistory || history;

    // ── SSE headers ──────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('event: ping\ndata: {}\n\n');

    // ── Injection check + user context injection ─────────────────────────
    const { messages: agentMessages, blocked, blockReply } = await prepareAgentMessages({
      userId,
      sessionId,
      message: message.trim(), // Multilingual direct query
      history: agentHistory,
    });

    if (blocked) {
      res.write(`data: ${JSON.stringify({ isCompleted: true, value: blockReply, blocked: true, sessionId, language })}\n\n`);
      res.end();
      return;
    }

    // ── Real Native Agent Streaming ──────────────────────────────────────
    let finalOutput = '';
    try {
      for await (const chunk of streamAgentResponse(agentMessages, userId, sessionId)) {
        if (chunk.isCompleted) {
          finalOutput = chunk.value;
        } else {
          // Stream real-time chunks natively directly to the frontend
          res.write(`data: ${JSON.stringify({ isCompleted: false, value: chunk.value })}\n\n`);
        }
      }
    } catch (streamErr) {
      // ── Fallback: synchronous agent call ─────────────────────────────
      logger.warn('[Chat-Stream] Real streaming failed, falling back to synchronous:', streamErr.message);
      const { reply } = await runChatAgent({
        userId,
        sessionId,
        message: message.trim(),
        history: agentHistory,
      });
      finalOutput = reply;
      res.write(`data: ${JSON.stringify({ isCompleted: false, value: finalOutput })}\n\n`);
    }

    // ── Persist to Redis + MongoDB ONLY after full completion ────────────
    const newMessages = [
      { role: 'user', content: message, ...(imageUrl ? { imageUrl } : {}) },
      { role: 'ai', content: finalOutput },
    ];
    appendSessionMessages(sessionId, newMessages);
    await ChatSession.findByIdAndUpdate(
      sessionId,
      { $push: { messages: { $each: newMessages } } }
    );

    // ── Final completion signal ──────────────────────────────────────────
    res.write(`data: ${JSON.stringify({ isCompleted: true, value: finalOutput, blocked: false, sessionId, language })}\n\n`);
    res.end();
  } catch (err) {
    logger.error("[Chat-Stream] SSE stream error:", err);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Agent error. Please try again.' })}\n\n`);
      res.end();
    }
  }
};

/**
 * getSessions — GET /api/chat/sessions
 * Returns a list of all chat sessions for the authenticated user.
 */
export const getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ sessions });
  } catch (err) {
    logger.error("[Chat] Get sessions error:", err);
    res.status(500).json({ error: "Failed to fetch chat sessions." });
  }
};

/**
 * getHistory — GET /api/chat/history/:sessionId
 * Returns the messages array for a specific session.
 */
export const getHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id }).lean();
    if (!session) return res.status(404).json({ error: "Session not found." });
    res.json({ history: session.messages });
  } catch (err) {
    logger.error("[Chat] History fetch error:", err);
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
};

/**
 * deleteSession — DELETE /api/chat/sessions/:sessionId
 * Deletes a specific session.
 */
export const deleteSession = async (req, res) => {
  try {
    const result = await ChatSession.findOneAndDelete({ _id: req.params.sessionId, user: req.user.id });
    if (!result) return res.status(404).json({ error: "Session not found." });
    res.json({ message: "Chat session deleted." });
  } catch (err) {
    logger.error("[Chat] Delete session error:", err);
    res.status(500).json({ error: "Failed to delete chat session." });
  }
};
