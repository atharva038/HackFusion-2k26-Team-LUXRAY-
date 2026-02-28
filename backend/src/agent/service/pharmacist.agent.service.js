import chatPharmacist from '../parent/parentPharmacist.parent.agent.js';
import { logAgentRun, detectPromptInjection } from '../../utils/agentLogger.js';
import logger from '../../utils/logger.js';
import User from '../../models/user.model.js';

const BLOCKED_REPLY = 'Please ask only pharmacy operational questions — stock, orders, inventory, or prescriptions.';

/**
 * Build the OpenAI-format messages array with:
 *  - Prompt injection check
 *  - Pharmacist context injection (name, role) in system block
 *  - Correct history mapping (role: 'ai' → role: 'assistant')
 *
 * @returns {{ messages: Array|null, blocked: boolean, blockReply: string|null }}
 */
export async function preparePharmacistMessages({ userId, sessionId, message, history = [] }) {
  if (detectPromptInjection(message)) {
    logger.warn(`[PharmacistAgent] Injection attempt from ${userId}: "${message.substring(0, 80)}"`);
    await logAgentRun({
      userId,
      sessionId,
      userMessage: message,
      agentResponse: null,
      status: 'blocked',
      injectionDetected: true,
      durationMs: 0,
    });
    return { messages: null, blocked: true, blockReply: BLOCKED_REPLY };
  }

  const user = await User.findById(userId).lean();
  let enhancedMessage = message;

  if (user) {
    // Inject pharmacist identity for tools that need pharmacist context (e.g., approvedBy)
    const ctx = `[PHARMACIST CONTEXT - DO NOT MENTION UNLESS ASKED: Logged-in pharmacist is "${user.name}". PharmacistID: ${user._id}. Role: ${user.role}. Use this PharmacistID as the "approvedBy" value when updating orders.]`;
    enhancedMessage = `${ctx}\n\nPharmacist Message: ${message}`;
  }

  const mappedHistory = history.map((msg) => {
    if (msg.role === 'ai') {
      return { role: 'assistant', content: [{ type: 'output_text', text: msg.content }] };
    }
    return { role: 'user', content: msg.content };
  });

  const messages = [...mappedHistory, { role: 'user', content: enhancedMessage }];
  return { messages, blocked: false, blockReply: null };
}

/**
 * runPharmacistAgent — synchronous agent call with:
 *  - Injection detection
 *  - Pharmacist context injection
 *  - Session history (Redis → MongoDB fallback handled by caller)
 *  - Audit logging (fire-and-forget)
 *
 * @param {{ userId, sessionId, message, history }} params
 * @returns {{ reply: string, blocked: boolean, durationMs: number }}
 */
export async function runPharmacistAgent({ userId, sessionId, message, history = [] }) {
  const startTime = Date.now();

  const { messages, blocked, blockReply } = await preparePharmacistMessages({
    userId,
    sessionId,
    message,
    history,
  });

  if (blocked) {
    return { reply: blockReply, blocked: true, durationMs: Date.now() - startTime };
  }

  let reply = '';
  let status = 'success';
  let errorMessage;

  try {
    reply = await chatPharmacist(messages);
    console.log("result of pharma agent in pharmacist.agent.service: ", reply)
  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    logger.error(`[PharmacistAgent] Run failed for ${userId}:`, err);
    throw err;
  } finally {
    const durationMs = Date.now() - startTime;
    await logAgentRun({
      userId,
      sessionId,
      userMessage: message,
      agentResponse: reply,
      status,
      errorMessage,
      durationMs,
    });
  }

  logger.info(`[PharmacistAgent] Reply in ${Date.now() - startTime}ms for ${userId}`);
  return { reply, blocked: false, durationMs: Date.now() - startTime };
}
