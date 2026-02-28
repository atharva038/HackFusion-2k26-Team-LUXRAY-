import express from 'express';
import AgentAuditLog from '../models/agentAuditLog.model.js';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/traces
 * Returns the 20 most recent AgentAuditLog entries containing traces.
 * Does not require authentication so anyone can monitor the AI behavior.
 */
router.get('/', async (req, res) => {
  try {
    const logs = await AgentAuditLog.find({ traces: { $exists: true, $not: { $size: 0 } } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({
         path: 'userId',
         select: 'name' // Only pull the name of the user for display context
      })
      .lean();

    // Map slightly to ensure we don't leak anything dangerous
    const safeLogs = logs.map(log => ({
      _id: log._id,
      sessionId: log.sessionId,
      userName: log.userId?.name || 'Anonymous User',
      userMessage: log.userMessage, // Safe to show text
      agentResponse: log.agentResponse, // The final output
      status: log.status,
      durationMs: log.durationMs,
      traces: log.traces,
      createdAt: log.createdAt,
    }));

    res.json({ traces: safeLogs });
  } catch (error) {
    logger.error('[Trace API] Fetch error:', error);
    res.status(500).json({ error: 'Failed to fully fetch AI trace data.' });
  }
});

export default router;
