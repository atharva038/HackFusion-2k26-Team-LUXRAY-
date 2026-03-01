import { run } from "@openai/agents";
import { parentAgent } from "../agent/parent/parentChat.agent.js";
import { detectPromptInjection, logAgentRun } from "../utils/agentLogger.js";
import User from "../models/user.model.js";
import logger from "../utils/logger.js";
import { isSocketInitialized, emitToUser } from "../config/socket.js";

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

/**
 * buildTracesFromResult — extract agent execution traces from a completed run result.
 * Mirrors the logic in parentChat.agent.js chatPharma() for consistent trace format.
 */
function buildTracesFromResult(result) {
  const traces = [];

  // 1. Input guardrail results
  if (result.state?._inputGuardrailResults?.length > 0) {
    result.state._inputGuardrailResults.forEach((g) => {
      traces.push({
        agent: "Security",
        action: !g.tripwireTriggered ? "🛡️ Guardrail: Pass" : "🚨 Guardrail: Block",
        data: `Input Check: ${g.guardrail?.name || g.guardrailName || "Pharmacy Filter"}`,
      });
    });
  }

  // 2. Generated items (tool calls, handoffs, messages)
  const generatedItems = result.state?._generatedItems || [];
  generatedItems.forEach((item) => {
    const actor =
      item.agent?.name || item.targetAgent?.name || "Parent_Agent";
    const itemType = item.type || item.constructor?.name || "";

    let actionName = "🤖 AI Reasoning";
    let detailData = "Processing...";

    if (
      item.rawItem?.type === "function_call" &&
      !item.rawItem.name?.includes("transfer_to")
    ) {
      actionName = `⚙️ Tool: ${item.rawItem.name}`;
      detailData = { input: item.rawItem.arguments || "Initiating..." };
    } else if (
      item.rawItem?.type === "function_call_result" ||
      item.rawItem?.type === "function_output" ||
      item.rawItem?.role === "tool"
    ) {
      const isError =
        item.rawItem.status === "error" || !!item.rawItem.error;
      actionName = isError
        ? `❌ Fail: ${item.rawItem.name || "Tool"}`
        : `📦 Result: ${item.rawItem.name || "Tool"}`;
      detailData = {
        output:
          item.rawItem.error ||
          item.rawItem.output?.text ||
          item.rawItem.output ||
          item.rawItem.content ||
          "No data returned",
      };
    } else if (item.rawItem?.name?.startsWith("transfer_to_")) {
      const target = item.rawItem.name.replace("transfer_to_", "");
      actionName = "🤝 Handoff";
      detailData = { target, message: `Routing context to: ${target}` };
    } else if (
      itemType === "message_output_item" ||
      item.rawItem?.type === "message" ||
      item.rawItem?.role === "assistant"
    ) {
      actionName =
        item.rawItem?.role === "assistant" && !item.rawItem?.tool_calls
          ? "🤖 AI Reasoning / Response"
          : "💬 Response";
      const messageText =
        item.rawItem?.content?.[0]?.text ||
        item.content ||
        item.rawItem?.content;
      detailData = {
        text:
          typeof messageText === "object"
            ? JSON.stringify(messageText)
            : messageText,
        parsed_reasoning: true,
      };
    } else if (itemType === "handoff_output_item") {
      actionName = "🔄 System";
      detailData = {
        message: `Agent ${item.targetAgent?.name || "Specialist"} activated.`,
      };
    }

    traces.push({ agent: actor, action: actionName, data: detailData });
  });

  // 3. Output guardrail results
  if (result.state?._outputGuardrailResults?.length > 0) {
    result.state._outputGuardrailResults.forEach((g) => {
      traces.push({
        agent: "Security",
        action: !g.tripwireTriggered ? "🛡️ Output: Safe" : "🚨 Output: Risky",
        data: `Validation: ${g.guardrail?.name || g.guardrailName || "Medical Safety"}`,
      });
    });
  }

  return traces;
}

export async function* streamAgentResponse(messages, userId, sessionId) {
  const startTime = Date.now();
  let accumulatedText = "";
  let status = "success";
  let errorMessage;
  let capturedTraces = [];

  try {
    const result = await run(parentAgent, messages, { stream: true });
    const stream = result.toTextStream();

    for await (const chunk of stream) {
      if (chunk && typeof chunk === "string") {
        accumulatedText += chunk;
        yield { isCompleted: false, value: chunk };
      }
    }

    // ── Extract traces AFTER stream completes ────────────────────────
    capturedTraces = buildTracesFromResult(result);

    // ── Prepend user input as the first trace node ───────────────────
    const lastUserMsg = messages[messages.length - 1];
    let userInputText = "";
    if (lastUserMsg) {
      if (typeof lastUserMsg.content === "string") {
        userInputText = lastUserMsg.content;
      } else if (Array.isArray(lastUserMsg.content)) {
        userInputText =
          lastUserMsg.content.map((c) => c.text || c.content || "").join(" ");
      }
      // Strip injected system context prefix so only the real user message shows
      const userMsgMatch = userInputText.match(/User Message:\s*([\s\S]*)$/i);
      if (userMsgMatch) userInputText = userMsgMatch[1].trim();
    }
    capturedTraces.unshift({
      agent: "User",
      action: "💬 User Input",
      data: userInputText || "(empty message)",
    });

    // ── Print every trace to terminal ────────────────────────────────
    console.log("\n📍 --- STREAM EXECUTION TRACE ---");
    capturedTraces.forEach((t, i) => {
      const shortData =
        typeof t.data === "string"
          ? t.data.substring(0, 80) + (t.data.length > 80 ? "..." : "")
          : JSON.stringify(t.data).substring(0, 80);
      console.log(`[${i}] ${String(t.agent).padEnd(15)} ➔ ${t.action}`);
      console.log(`    └─ ${shortData}`);
    });
    console.log("--------------------------\n");

    // ── Emit traces to the user via socket (real-time traces page) ───
    if (isSocketInitialized()) {
      emitToUser(userId, "agent:trace", { traces: capturedTraces, sessionId });
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
      traces: capturedTraces,
    }).catch(() => {});
  }
}
