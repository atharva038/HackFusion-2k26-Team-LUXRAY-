import { runOrchestrator  } from '../agent/orchestrator.agent.js';
import logger from '../utils/logger.js';

/**
 * Handle an incoming chat message by passing it through the AI orchestrator.
 */
export const handleMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    logger.info(`User message: "${message}"`);
    const result = await runOrchestrator(message);
    res.json(result);
  } catch (err) {
    logger.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Return chat history (placeholder — extend with DB persistence).
 */
export const getHistory = async (req, res) => {
  // TODO: Fetch from a ChatHistory model
  res.json({ history: [] });
};
