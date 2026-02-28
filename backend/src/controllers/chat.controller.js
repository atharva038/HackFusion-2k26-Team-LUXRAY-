import logger from "../utils/logger.js";
import { runChatAgent } from "../agent/service/chat.agent.service.js";
import ChatSession from "../models/chatSession.model.js";
import { translateToEnglish, translateFromEnglish } from "../services/multilingual.service.js";
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
    if (reqSessionId) {
      session = await ChatSession.findOne({ _id: reqSessionId, user: userId }).select('_id messages').lean();
      if (!session) return res.status(404).json({ error: "Session not found." });
      sessionId = session._id.toString();
    } else {
      const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
      const newSession = await ChatSession.create({ user: userId, title, messages: [] });
      session = newSession.toObject();
      sessionId = session._id.toString();
    }
    const history = session?.messages || [];

    // ── Session Memory: try Redis first, fall back to MongoDB history ───
    const redisHistory = await getSessionHistory(sessionId);
    const agentHistory = redisHistory || history;

    // ── Multilingual Pre-Agent Translation ───────────────────────
    const { translatedText: englishMessage, latencyMs: preTranslateMs } = await translateToEnglish(message, language);

    // Run through the agent service (handles injection guard + audit log)
    const { reply, blocked, durationMs } = await runChatAgent({
      userId,
      sessionId,
      message: englishMessage,
      history: agentHistory,
    });

    // ── Multilingual Post-Agent Translation ──────────────────────
    const { translatedText: translatedReply, latencyMs: postTranslateMs } = await translateFromEnglish(reply, language);

    if (language !== 'en') {
      logger.info(`[Multilingual Trace] lang=${language} preTranslate=${preTranslateMs}ms postTranslate=${postTranslateMs}ms`);
    }

    // Persist both turns ──────────────────────────────────────────────────
    const newMessages = [
      { role: 'user', content: message, ...(imageUrl ? { imageUrl } : {}) },
      { role: 'ai', content: translatedReply },
    ];

    // Redis session (fast, temporary)
    appendSessionMessages(sessionId, newMessages);

    // MongoDB (persistent)
    await ChatSession.findByIdAndUpdate(
      sessionId,
      { $push: { messages: { $each: newMessages } } }
    );

    logger.info(`[Chat] Agent replied in ${durationMs}ms for user [${userId}]${blocked ? ' [BLOCKED]' : ''}`);

    res.json({ text: translatedReply, blocked, sessionId, language });
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
    if (reqSessionId) {
      session = await ChatSession.findOne({ _id: reqSessionId, user: userId }).select('_id messages').lean();
      if (!session) return res.status(404).json({ error: "Session not found." });
      sessionId = session._id.toString();
    } else {
      const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
      const newSession = await ChatSession.create({ user: userId, title, messages: [] });
      session = newSession.toObject();
      sessionId = session._id.toString();
    }
    const history = session?.messages || [];

    // ── Session Memory: try Redis first, fall back to MongoDB ────────────
    const redisHistory = await getSessionHistory(sessionId);
    const agentHistory = redisHistory || history;

    // ── SSE headers ──────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('event: ping\ndata: {}\n\n');

    // ── Multilingual Pre-Agent Translation (non-streamed) ────────────────
    const { translatedText: englishMessage } = await translateToEnglish(message.trim(), language);

    // ── Injection check + user context injection ─────────────────────────
    const { messages: agentMessages, blocked, blockReply } = await prepareAgentMessages({
      userId,
      sessionId,
      message: englishMessage,
      history: agentHistory,
    });

    if (blocked) {
      res.write(`data: ${JSON.stringify({ isCompleted: true, value: blockReply, blocked: true, sessionId, language })}\n\n`);
      res.end();
      return;
    }

    // ── Real Agent Streaming ─────────────────────────────────────────────
    let finalEnglishOutput = '';
    try {
      for await (const chunk of streamAgentResponse(agentMessages, userId, sessionId)) {
        if (chunk.isCompleted) {
          finalEnglishOutput = chunk.value;
        } else if (language === 'en') {
          // English: forward real-time chunks directly to the frontend
          res.write(`data: ${JSON.stringify({ isCompleted: false, value: chunk.value })}\n\n`);
        }
        // Non-English: silently buffer; finalOutput set by the isCompleted chunk above
      }
    } catch (streamErr) {
      // ── Fallback: synchronous agent call ─────────────────────────────
      logger.warn('[Chat-Stream] Real streaming failed, falling back to synchronous:', streamErr.message);
      const { reply } = await runChatAgent({
        userId,
        sessionId,
        message: englishMessage,
        history: agentHistory,
      });
      finalEnglishOutput = reply;
    }

    // ── Multilingual Post-Agent Translation (non-streamed) ───────────────
    const { translatedText: finalReply, latencyMs: postTranslateMs } = await translateFromEnglish(finalEnglishOutput, language);

    if (language !== 'en') {
      logger.info(`[Chat-Stream] Post-translate ${language} in ${postTranslateMs}ms`);
      // Stream translated words progressively (simulated reveal for non-English)
      const words = finalReply.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ isCompleted: false, value: word + ' ' })}\n\n`);
        await new Promise(r => setTimeout(r, 15));
      }
    }

    // ── Persist to Redis + MongoDB ONLY after full completion ────────────
    const newMessages = [
      { role: 'user', content: message, ...(imageUrl ? { imageUrl } : {}) },
      { role: 'ai', content: finalReply },
    ];
    appendSessionMessages(sessionId, newMessages);
    await ChatSession.findByIdAndUpdate(
      sessionId,
      { $push: { messages: { $each: newMessages } } }
    );

    // ── Final completion signal ──────────────────────────────────────────
    res.write(`data: ${JSON.stringify({ isCompleted: true, value: finalReply, blocked: false, sessionId, language })}\n\n`);
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
