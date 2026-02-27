import { run } from '@openai/agents';
import { parentPharamcist } from '../agent/parent/parentPharmacist.parent.agent.js';
import { runPharmacistAgent, preparePharmacistMessages } from '../agent/service/pharmacist.agent.service.js';
import { logAgentRun } from '../utils/agentLogger.js';
import ChatSession from '../models/chatSession.model.js';
import { getSessionHistory, appendSessionMessages } from '../services/cache.service.js';
import logger from '../utils/logger.js';

// ─── Session helpers ───────────────────────────────────────────────────────

async function resolveSession(userId, reqSessionId, messagePreview) {
  if (reqSessionId) {
    const session = await ChatSession.findOne({
      _id: reqSessionId,
      user: userId,
      agentType: 'pharmacist',
    }).select('_id messages').lean();
    if (!session) return { error: 'Session not found.' };
    return { session, sessionId: session._id.toString() };
  }

  const title = `[AI] ${messagePreview.substring(0, 40)}${messagePreview.length > 40 ? '...' : ''}`;
  const newSession = await ChatSession.create({
    user: userId,
    title,
    messages: [],
    agentType: 'pharmacist',
  });
  const session = newSession.toObject();
  return { session, sessionId: session._id.toString() };
}

async function persistMessages(sessionId, userMessage, aiReply) {
  const newMessages = [
    { role: 'user', content: userMessage },
    { role: 'ai', content: aiReply },
  ];
  appendSessionMessages(sessionId, newMessages); // Redis (fire-and-forget)
  await ChatSession.findByIdAndUpdate(
    sessionId,
    { $push: { messages: { $each: newMessages } } }
  );
}

// ─── POST /api/admin/agent/chat ────────────────────────────────────────────

/**
 * handlePharmacistMessage — sync pharmacist agent.
 * Body: { message: string, sessionId?: string }
 */
export const handlePharmacistMessage = async (req, res) => {
  try {
    const { message, sessionId: reqSessionId } = req.body;
    const userId = req.user.id;

    logger.info(`[PharmacistAgent] [${userId}] → "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`);

    const { session, sessionId, error } = await resolveSession(userId, reqSessionId, message);
    if (error) return res.status(404).json({ error });

    const redisHistory = await getSessionHistory(sessionId);
    const agentHistory = redisHistory || session.messages || [];

    const { reply, blocked, durationMs } = await runPharmacistAgent({
      userId,
      sessionId,
      message,
      history: agentHistory,
    });

    await persistMessages(sessionId, message, reply);

    logger.info(`[PharmacistAgent] Done in ${durationMs}ms for [${userId}]${blocked ? ' [BLOCKED]' : ''}`);
    res.json({ text: reply, blocked, sessionId });
  } catch (err) {
    logger.error('[PharmacistAgent] handlePharmacistMessage error:', err);
    res.status(500).json({ error: 'AI agent is temporarily unavailable. Please try again.' });
  }
};

// ─── POST /api/admin/agent/chat/stream ────────────────────────────────────

/**
 * handlePharmacistStream — SSE streaming pharmacist agent.
 * Streams token-by-token using the OpenAI Agents SDK run({ stream: true }).
 *
 * SSE event shape:
 *   { isCompleted: false, value: "<chunk>" }   — live text chunk
 *   { isCompleted: true,  value: "<full>", sessionId, blocked }  — done
 *   { error: "<msg>" }  — error
 */
export const handlePharmacistStream = async (req, res) => {
  const startTime = Date.now();
  let accumulatedText = '';
  let status = 'success';
  let errorMessage;
  let sessionId;
  let userId;

  try {
    const { message, sessionId: reqSessionId } = req.body;
    userId = req.user.id;

    logger.info(`[PharmacistStream] [${userId}] → "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`);

    // ── Session resolution ────────────────────────────────────────────────
    const { session, sessionId: sid, error } = await resolveSession(userId, reqSessionId, message);
    if (error) return res.status(404).json({ error });
    sessionId = sid;

    const redisHistory = await getSessionHistory(sessionId);
    const agentHistory = redisHistory || session.messages || [];

    // ── SSE headers ───────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('event: ping\ndata: {}\n\n');

    // ── Injection check + context injection ───────────────────────────────
    const { messages: agentMessages, blocked, blockReply } = await preparePharmacistMessages({
      userId,
      sessionId,
      message,
      history: agentHistory,
    });

    if (blocked) {
      await persistMessages(sessionId, message, blockReply);
      res.write(`data: ${JSON.stringify({ isCompleted: true, value: blockReply, blocked: true, sessionId })}\n\n`);
      res.end();
      return;
    }

    // ── Real streaming via OpenAI Agents SDK ─────────────────────────────
    try {
      const result = await run(parentPharamcist, agentMessages, { stream: true });
      const stream = result.toTextStream();

      for await (const chunk of stream) {
        if (chunk && typeof chunk === 'string') {
          accumulatedText += chunk;
          res.write(`data: ${JSON.stringify({ isCompleted: false, value: chunk })}\n\n`);
        }
      }

      // Use authoritative finalOutput (not accumulated chunks which may differ)
      const finalOutput = result.finalOutput || accumulatedText;
      accumulatedText = finalOutput;

      await persistMessages(sessionId, message, finalOutput);

      res.write(`data: ${JSON.stringify({ isCompleted: true, value: finalOutput, blocked: false, sessionId })}\n\n`);
      res.end();

    } catch (streamErr) {
      // ── Fallback: synchronous agent call ─────────────────────────────
      logger.warn('[PharmacistStream] Streaming failed, falling back to sync:', streamErr.message);
      status = 'success'; // reset status for fallback

      const { reply } = await runPharmacistAgent({
        userId,
        sessionId,
        message,
        history: agentHistory,
      });
      accumulatedText = reply;

      await persistMessages(sessionId, message, reply);

      // Simulate streaming: emit word-by-word
      const words = reply.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ isCompleted: false, value: word + ' ' })}\n\n`);
        await new Promise(r => setTimeout(r, 12));
      }

      res.write(`data: ${JSON.stringify({ isCompleted: true, value: reply, blocked: false, sessionId })}\n\n`);
      res.end();
    }

  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    logger.error('[PharmacistStream] Fatal error:', err);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Agent error. Please try again.' })}\n\n`);
      res.end();
    }
  } finally {
    // Audit log for the streaming path
    if (userId && sessionId) {
      const durationMs = Date.now() - startTime;
      logAgentRun({
        userId,
        sessionId,
        userMessage: req.body?.message || '',
        agentResponse: accumulatedText,
        status,
        errorMessage,
        durationMs,
      }).catch(() => {});
    }
  }
};

// ─── GET /api/admin/agent/sessions ────────────────────────────────────────

export const getPharmacistSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id, agentType: 'pharmacist' })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ sessions });
  } catch (err) {
    logger.error('[PharmacistAgent] Get sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
};

// ─── GET /api/admin/agent/history/:sessionId ──────────────────────────────

export const getPharmacistHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.sessionId,
      user: req.user.id,
      agentType: 'pharmacist',
    }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json({ history: session.messages });
  } catch (err) {
    logger.error('[PharmacistAgent] History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
};

// ─── DELETE /api/admin/agent/sessions/:sessionId ──────────────────────────

export const deletePharmacistSession = async (req, res) => {
  try {
    const result = await ChatSession.findOneAndDelete({
      _id: req.params.sessionId,
      user: req.user.id,
      agentType: 'pharmacist',
    });
    if (!result) return res.status(404).json({ error: 'Session not found.' });
    res.json({ message: 'Session deleted.' });
  } catch (err) {
    logger.error('[PharmacistAgent] Delete session error:', err);
    res.status(500).json({ error: 'Failed to delete session.' });
  }
};
