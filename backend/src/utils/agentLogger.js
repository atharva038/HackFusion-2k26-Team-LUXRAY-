import AgentAuditLog from '../models/agentAuditLog.model.js';
import logger from './logger.js';

/**
 * Prompt injection patterns — messages matching these are blocked before
 * reaching the LLM to prevent jailbreaking attempts.
 */
const INJECTION_PATTERNS = [
  /ignore (previous|all|your) instructions/i,
  /you are now/i,
  /forget your (rules|prompt|instructions)/i,
  /act as if/i,
  /disregard/i,
  /override (your|the) (instructions|rules|prompt)/i,
  /pretend you are/i,
  /new (persona|role|identity)/i,
];

/**
 * detectPromptInjection — check if a message looks like a prompt injection attempt.
 * @param {string} message
 * @returns {boolean}
 */
export function detectPromptInjection(message) {
  if (!message || typeof message !== 'string') return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * logAgentRun — persists an agent run audit record to MongoDB.
 * Fire-and-forget; errors are swallowed so they never break the chat flow.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.sessionId
 * @param {string} params.userMessage
 * @param {string} params.agentResponse
 * @param {string[]} params.agentChain
 * @param {string[]} params.toolsUsed
 * @param {number}  params.durationMs
 * @param {'success'|'error'|'blocked'} params.status
 * @param {string}  [params.errorMessage]
 * @param {boolean} [params.injectionDetected]
 */
export async function logAgentRun({
  userId,
  sessionId,
  userMessage,
  agentResponse,
  agentChain = [],
  toolsUsed = [],
  durationMs,
  status = 'success',
  errorMessage,
  injectionDetected = false,
}) {
  try {
    await AgentAuditLog.create({
      userId,
      sessionId,
      userMessage,
      agentResponse,
      agentChain,
      toolsUsed,
      durationMs,
      status,
      errorMessage,
      injectionDetected,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    });
  } catch (err) {
    // Never let audit logging crash the main request
    logger.error('[agentLogger] Failed to write audit log:', err.message);
  }
}
