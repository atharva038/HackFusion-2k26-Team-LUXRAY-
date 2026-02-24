const { runOrchestrator } = require('../agents/orchestrator.agent');
const logger = require('../utils/logger');

/**
 * Handle an incoming chat message by passing it through the AI orchestrator.
 */
exports.handleMessage = async (req, res) => {
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
exports.getHistory = async (req, res) => {
  // TODO: Fetch from a ChatHistory model
  res.json({ history: [] });
};
