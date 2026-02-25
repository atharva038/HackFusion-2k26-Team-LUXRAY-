import { runOrchestrator } from '../agent/orchestrator.agent.js';
import logger from '../utils/logger.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHAT_LOG_PATH = join(__dirname, '..', '..', 'chat_history.json');

function loadChatHistory() {
  try {
    if (existsSync(CHAT_LOG_PATH)) {
      return JSON.parse(readFileSync(CHAT_LOG_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return [];
}

function saveChatHistory(history) {
  writeFileSync(CHAT_LOG_PATH, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * Handle an incoming chat message by passing it through the AI orchestrator.
 */
export const handleMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    logger.info(`User message: "${message}"`);
    const result = await runOrchestrator(message);

    // Persist to JSON file
    const history = loadChatHistory();
    history.push({
      timestamp: new Date().toISOString(),
      user: message,
      ai: result.text,
      toolCalls: result.toolCalls || [],
    });
    saveChatHistory(history);

    res.json(result);
  } catch (err) {
    logger.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Return chat history from JSON file.
 */
export const getHistory = async (req, res) => {
  const history = loadChatHistory();
  res.json({ history });
};
