import logger from "../utils/logger.js";
import { runChatAgent } from "../agent/service/chat.agent.service.js";
import ChatSession from "../models/chatSession.model.js";
import chatPharma from "../agent/parent/parentChat.agent.js";

/**
 * handleMessage — POST /api/chat
 * Receives a user message, runs it through the agent service,
 * persists both turns to MongoDB, and returns the AI reply.
 */
export const handleMessage = async (req, res) => {
  try {
    const { message, sessionId: reqSessionId } = req.body; // Already validated & sanitised by Zod middleware
    const userId = req.user.id;

    logger.info(`[Chat] User [${userId}] → "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`);

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

    // Run through the agent service (handles injection guard + audit log)
    const { reply, blocked, durationMs } = await runChatAgent({
      userId,
      sessionId,
      message,
      history,
    });

    // Persist both turns to MongoDB
    await ChatSession.findByIdAndUpdate(
      sessionId,
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message },
              { role: 'ai',   content: reply  },
            ],
          },
        },
      }
    );

    logger.info(`[Chat] Agent replied in ${durationMs}ms for user [${userId}]${blocked ? ' [BLOCKED]' : ''}`);

    res.json({ text: reply, blocked, sessionId });
  } catch (err) {
    logger.error("[Chat] handleMessage error:", err);
    res.status(500).json({ error: "AI agent is temporarily unavailable. Please try again." });
  }
};

/**
 * handleStreamMessage — GET /api/chat/stream
 * SSE streaming endpoint — sends agent response token-by-token.
 * Falls back to chunked response if streaming is disabled.
 *
 * Query params:
 *   ?message=<url-encoded-message>
 *   ?sessionId=<optional-session-id>
 *   ?token=<jwt> (since EventSource doesn't support custom headers)
 */
export const handleStreamMessage = async (req, res) => {
  try {
    const message = req.query.message;
    const reqSessionId = req.query.sessionId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: "Message is too long (max 1000 characters)" });
    }

    const userId = req.user.id;
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

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Send initial ping
    res.write('event: ping\ndata: {}\n\n');

    const { reply, blocked } = await runChatAgent({
      userId,
      sessionId,
      message: message.trim(),
      history,
    });

    // Simulate word-by-word streaming (real streaming requires OpenAI stream API)
    const words = reply.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ chunk: word + ' ' })}\n\n`);
      // Small delay to simulate streaming (remove if using real OpenAI stream)
      await new Promise(r => setTimeout(r, 20));
    }

    // Persist to DB
    await ChatSession.findByIdAndUpdate(
      sessionId,
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message },
              { role: 'ai',   content: reply  },
            ],
          },
        },
      }
    );

    // Signal completion
    res.write(`data: ${JSON.stringify({ done: true, blocked, sessionId })}\n\n`);
    res.end();
  } catch (err) {
    logger.error("[Chat] SSE stream error:", err);
    res.write(`data: ${JSON.stringify({ error: 'Agent error. Please try again.' })}\n\n`);
    res.end();
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
