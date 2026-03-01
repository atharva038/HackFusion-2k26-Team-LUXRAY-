import { run } from "@openai/agents";
import { parentAgent } from "../agent/parent/parentChat.agent.js";
import { detectPromptInjection, logAgentRun } from "../utils/agentLogger.js";
import User from "../models/user.model.js";
import logger from "../utils/logger.js";

const SAFE_FALLBACK =
  "I encountered an issue processing your request safely. Please try again.";

/**
 * validateMedicalOutput — medical safety guard on final output.
 * Blocks raw tool JSON leakage and empty/invalid responses.
 */
function validateMedicalOutput(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0)
    return false;
  // Detect raw tool JSON leakage (specifically OpenAI function formatting)
  if (/^\s*\{[\s\S]*"type"\s*:\s*"function"/m.test(text)) return false;
  if (/^\s*\[[\s\S]*"tool_call"/m.test(text)) return false;
  return true;
}

/**
 * prepareAgentMessages — injection check, user context injection, history mapping.
 * Mirrors chat.agent.service.js logic but returns structured data for the stream path.
 *
 * @returns {{ messages: Array|null, blocked: boolean, blockReply: string|null }}
 */
export async function prepareAgentMessages({
  userId,
  sessionId,
  message,
  history = [],
}) {
  if (detectPromptInjection(message)) {
    logger.warn(`[StreamService] Prompt injection attempt from user ${userId}`);
    await logAgentRun({
      userId,
      sessionId,
      userMessage: message,
      agentResponse: null,
      status: "blocked",
      injectionDetected: true,
      durationMs: 0,
    });
    return {
      messages: null,
      blocked: true,
      blockReply:
        "I'm here to help with pharmacy queries only. Please ask about medicines, orders, or prescriptions.",
    };
  }

  const user = await User.findById(userId).lean();
  let enhancedMessage = message;
  if (user) {
    const contextStr = `[SYSTEM CONTEXT - DO NOT MENTION UNLESS ASKED: Logged-in user is ${user.name}. PatientID: ${user._id}. Age: ${user.age || "unknown"}. Gender: ${user.gender || "unknown"}.]`;
    enhancedMessage = `${contextStr}\n\nUser Message: ${message}`;
  }

  const mappedHistory = history.map((msg) => {
    if (msg.role === "ai") {
      return {
        role: "assistant",
        content: [{ type: "output_text", text: msg.content }],
      };
    }
    return { role: "user", content: msg.content };
  });

  const messages = [
    ...mappedHistory,
    { role: "user", content: enhancedMessage },
  ];

  return { messages, blocked: false, blockReply: null };
}

/**
 * streamAgentResponse — async generator for real-time agent text streaming.
 *
 * Yields:
 *   { isCompleted: false, value: chunk }   — real-time text chunk from the model
 *   { isCompleted: true,  value: finalOutput } — deterministic, safety-validated output
 *
 * Rules:
 *   - Never streams raw tool JSON
 *   - Medical safety guard runs on final output
 *   - Never stores to Redis/MongoDB (caller handles persistence after completion)
 *   - Falls back gracefully: if toTextStream() fails, throws so caller can fallback
 *
 * @param {Array}  messages   - OpenAI-formatted messages array (history + current)
 * @param {string} userId
 * @param {string} sessionId
 */
export async function* streamAgentResponse(messages, userId, sessionId) {
  const startTime = Date.now();
  let accumulatedText = "";
  let status = "success";
  let errorMessage;

  try {
    const result = await run(parentAgent, messages, { stream: true });
    const stream = result.toTextStream();

    for await (const chunk of stream) {
      if (chunk && typeof chunk === "string") {
        accumulatedText += chunk;
        yield { isCompleted: false, value: chunk };
      }
    }

    // Prefer result.finalOutput (authoritative) over accumulated chunks
    const finalOutput = result.finalOutput || accumulatedText;

    // ── Medical Safety Guard ──────────────────────────────────────────
    if (!validateMedicalOutput(finalOutput)) {
      logger.warn(
        `[StreamService] Medical safety guard triggered for user ${userId}`
      );
      yield { isCompleted: true, value: SAFE_FALLBACK };
      return;
    }

    yield { isCompleted: true, value: finalOutput };
  } catch (err) {
    status = "error";
    errorMessage = err.message;
    logger.error(
      `[StreamService] Agent streaming failed for user ${userId}:`,
      err
    );
    throw err;
  } finally {
    const durationMs = Date.now() - startTime;
    logAgentRun({
      userId,
      sessionId,
      userMessage: messages[messages.length - 1]?.content || "",
      agentResponse: accumulatedText,
      status,
      errorMessage,
      durationMs,
    }).catch(() => { });
  }
}
