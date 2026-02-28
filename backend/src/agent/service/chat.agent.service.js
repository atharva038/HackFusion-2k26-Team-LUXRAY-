import chatPharma from '../parent/parentChat.agent.js';
import { logAgentRun, detectPromptInjection } from '../../utils/agentLogger.js';
import logger from '../../utils/logger.js';
import User from '../../models/user.model.js';

export async function runChatAgent({ userId, sessionId, message, history = [] }) {
  const startTime = Date.now();

  if (detectPromptInjection(message)) {
    const durationMs = Date.now() - startTime;
    logger.warn(`[AgentService] Prompt injection attempt from user ${userId}: "${message}"`);

    await logAgentRun({
      userId,
      sessionId,
      userMessage: message,
      agentResponse: null,
      status: 'blocked',
      injectionDetected: true,
      durationMs,
    });

    return {
      reply: "I'm here to help with pharmacy queries only. Please ask about medicines, orders, or prescriptions.",
      blocked: true,
      durationMs,
    };
  }

  // Fetch full user profile to inject context
  const user = await User.findById(userId).lean();
  let enhancedMessage = message;

  if (user) {
    const contextStr = `[SYSTEM CONTEXT - DO NOT MENTION UNLESS ASKED: Logged-in user is ${user.name}. PatientID: ${user._id}. Age: ${user.age || 'unknown'}. Gender: ${user.gender || 'unknown'}.]`;
    enhancedMessage = `${contextStr}\n\nUser Message: ${message}`;
  }

  // Prepare standard OpenAI messages array with history
  const mappedHistory = history.map(msg => {
    if (msg.role === 'ai') {
      return {
        role: 'assistant',
        content: [{ type: 'output_text', text: msg.content }]
      };
    }
    return {
      role: 'user',
      content: msg.content
    };
  });
  const messages = [...mappedHistory, { role: 'user', content: enhancedMessage }];

  let reply = '';
  let traces = [];
  let status = 'success';
  let errorMessage;

  try {
    const agentOutcome = await chatPharma(messages);
    reply = agentOutcome.output;
    traces = agentOutcome.traces || [];
  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    logger.error(`[AgentService] Agent run failed for user ${userId}:`, err);
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
      traces,
    });
  }

  const durationMs = Date.now() - startTime;
  logger.info(`[AgentService] Agent reply in ${durationMs}ms for user ${userId}`);

  return { reply, blocked: false, durationMs };
}
