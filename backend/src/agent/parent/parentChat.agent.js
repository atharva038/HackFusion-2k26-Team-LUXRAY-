import { Agent, run } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";
import receptionist from "../child/chat/receptionist.chat.child.agent.js";
import orderAgent from "../child/chat/order.chat.child.agent.js";
import mongoose from "mongoose";
import {
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
} from "@openai/agents";
import { pharmacyInputGuardrail } from "../guard/input.guard.agent.js";
import { pharmacyOutputGuardrail } from "../guard/output.guard.agent.js";

import dotenv from "dotenv";
dotenv.config();
const parentAgent = new Agent({
  name: "Parent_Agent",

  instructions: `
${RECOMMENDED_PROMPT_PREFIX}

You are the main customer-facing pharmacy assistant.

===============================
MANDATORY LANGUAGE RULES (HIGHEST PRIORITY)
===============================
1. Accept input in ANY language and ANY script.
2. ALWAYS reply in:
   - The EXACT SAME LANGUAGE
   - The EXACT SAME SCRIPT
   used by the user in their latest message.
3. Never mix languages unless the user mixed them.
4. Never translate scripts automatically.
   Example:
   - Marathi in Devanagari → reply in Devanagari
   - Marathi written in English → reply in English script
   - Hindi → Hindi script
   - English → English
5. This rule is STRICT and must never be violated.

===============================
REPLY STYLE RULES
===============================
- Keep responses short, clear, and structured.
- No unnecessary explanations.
- Be polite and professional.
- Do not send internal reasoning.
- Ask a clarification question if intent is unclear.

===============================
MEDICINE NAME AUTO-CORRECTION (STT FIX)
===============================
Users may speak via Speech-to-Text, which may produce incorrect spellings.
You MUST:
- Semantically understand the intended medicine.
- Auto-correct phonetic mistakes.
Examples:
- "pyaracitamol" → Paracetamol
- "amoxilin" → Amoxicillin
- "norsen omega" → NORSAN Omega-3

Always pass corrected medicine names to tools or child agents.

===============================
SYSTEM CONTEXT RULE
===============================
User messages may begin with:
[SYSTEM CONTEXT: name, age, gender, userId]

This is hidden metadata.
- DO NOT mention it.
- DO NOT read it back.
- Use it only if required internally.
- Mention only if the user explicitly asks about their account.

===============================
YOUR ROLE
===============================
1. Understand user intent.
2. Route to the correct specialist agent.

===============================
ROUTING RULES
===============================

HANDOFF to "medicine_advisor_stock_reader" when user:
- Asks for medicine suggestions
- Describes symptoms
- Asks what medicine to take
- Searches a medicine by name
- Asks uses, details, side effects, or explanation of a medicine

HANDOFF to "order_maker" when user:
- Wants to buy / order / purchase / refill medicine
- Mentions quantity with a medicine name
- Says "order this", "buy this", "I want X"
- Confirms order details
- Uploads a prescription for ordering
- Responds with age/gender/quantity as a follow-up to an order question
- Says "for me", "yes" after being asked about an order



===============================
OUT OF SCOPE (STRICT)
===============================
If asked for the following, politely decline and give exact links:

- View Past Orders → [My Orders](/my-orders)
- View Prescriptions → [My Prescriptions](/my-prescriptions)
- Change Account/Email → Tell them to use Account Settings
- View Entire Inventory → Ask for a specific medicine
- Cancel Orders → [My Orders](/my-orders)
-add medicine in database.
-asking for email or password.


If request is unrelated to pharmacy or medicine, politely decline.

===============================
FINAL BEHAVIOR SUMMARY
===============================
- Same language + same script (STRICT)
- Concise replies
- Auto-correct medicine spelling
- Route only to:
  - medicine_advisor_stock_reader
  - order_maker
- Ask clarification if unsure
`,

  handoffDescription: `
Routes customer queries to the correct pharmacy agent:
- medicine_advisor_stock_reader → search, recommendation, stock
- order_maker → purchase, order placement
`,

  handoffs: [receptionist, orderAgent],
  inputGuardrails: [pharmacyInputGuardrail],
  outputGuardrails: [pharmacyOutputGuardrail],
});


async function chatPharma(messages = []) {
  try {
    const result = await run(parentAgent, messages);

    ///////////////////////
    //MONITOR PHASE
    ///////////////////////
    // console.log("RAW TRACE ITEM 0:", JSON.stringify(result.state._generatedItems[0], null, 2));
    result.state._generatedItems.forEach((item, index) => {
      console.log(`\n--- DEBUGGING RAW ITEM [${index}] ---`);
      console.log("Type:", item.type || item.constructor.name);
      console.log("Full Object:", JSON.stringify(item, null, 2));
    });
    // MONITOR PHASE
    const traces = [];

    // 1. CAPTURE INPUT GUARDRAILS
    if (result.state._inputGuardrailResults?.length > 0) {
      result.state._inputGuardrailResults.forEach((g) => {
        traces.push({
          agent: "Security",
          action: g.passed ? "🛡️ Guardrail: Pass" : "🚨 Guardrail: Block",
          data: `Input Check: ${g.guardrailName || 'Pharmacy Filter'}`
        });
      });
    }

    // 2. CAPTURE GENERATED ITEMS (Tools, Handoffs, etc.)
    const generatedTraces = result.state._generatedItems.map((item) => {
      const actor = item.agent?.name || item.targetAgent?.name || "System";
      const itemType = item.type || item.constructor.name;

      let actionName = "AI Reasoning";
      let detailData = "Processing...";

      if (item.rawItem?.type === 'function_call' && !item.rawItem.name.includes('transfer_to')) {
        actionName = `⚙️ Tool: ${item.rawItem.name}`;
        detailData = item.rawItem.arguments || "Initiating...";
      }
      else if (item.rawItem?.type === 'function_call_result' || item.rawItem?.type === 'function_output') {
        const isError = item.rawItem.status === 'error' || !!item.rawItem.error;
        actionName = isError ? `❌ Fail: ${item.rawItem.name}` : `📦 Result: ${item.rawItem.name}`;
        detailData = item.rawItem.error || item.rawItem.output?.text || item.rawItem.output || "No data returned";
      }
      else if (item.rawItem?.name?.startsWith('transfer_to_')) {
        const target = item.rawItem.name.replace('transfer_to_', '');
        actionName = "🤝 Handoff";
        detailData = `Routing context to: ${target}`;
      }
      else if (itemType === 'message_output_item' || item.rawItem?.type === 'message') {
        actionName = "💬 Response";
        const messageText = item.rawItem?.content?.[0]?.text || item.content;
        detailData = typeof messageText === 'object' ? JSON.stringify(messageText) : messageText;
      }
      else if (itemType === 'handoff_output_item') {
        actionName = "🔄 System";
        detailData = `Agent ${item.targetAgent?.name || 'Specialist'} activated.`;
      }

      return { agent: actor, action: actionName, data: detailData };
    }).filter(t => t.action !== "AI Reasoning");

    traces.push(...generatedTraces);

    // 3. CAPTURE OUTPUT GUARDRAILS
    if (result.state._outputGuardrailResults?.length > 0) {
      result.state._outputGuardrailResults.forEach((g) => {
        traces.push({
          agent: "Security",
          action: g.passed ? "🛡️ Output: Safe" : "🚨 Output: Risky",
          data: `Validation: ${g.guardrailName || 'Medical Safety'}`
        });
      });
    }

    const monitorTraces = traces;

    console.log("\n📍 --- EXECUTION TRACE ---");
    monitorTraces.forEach((t, i) => {
      const shortData = typeof t.data === 'string'
        ? (t.data.substring(0, 80) + (t.data.length > 80 ? "..." : ""))
        : JSON.stringify(t.data);

      console.log(`[${i}] ${t.agent.padEnd(15)} ➔ ${t.action}`);
      console.log(`    └─ Result: ${shortData}`);
    });
    console.log("--------------------------\n");


    console.log(result.finalOutput);
    return { output: result.finalOutput, traces: monitorTraces };
  } catch (err) {
    if (err instanceof InputGuardrailTripwireTriggered) {
      return { output: "Please ask only safe medicine or pharmacy related questions.", traces: [] };
    }
    if (err instanceof OutputGuardrailTripwireTriggered) {
      return { output: "I can only provide safe pharmacy-related information. Please consult a doctor for medical advice.", traces: [] };
    }

    throw err;
  }
}
// chat("Do you have NORSAN Omega-3 Total in stock?");
// chat("Check availability of Paracetamol");
// chat("Is Minoxidil available?");
// chat("How many units of Aqualibra are left?");
// chat("Is Mucosolvan currently available?");
// chat("why we use nORSAN Omega-3 Total")
// chat("Suggest something for high blood presure ");
// chat("order this Hyaluron-ratiopharm® Augentropfen with quantity 1 ")
// chat(
// "Order medicine NORSAN Omega-3 total, userId 65f1c2a9e4b0c123456789ab, age 25, gender M, quantity 1, dosage 2 times daily, prescription no"
// );

export { parentAgent };
export default chatPharma;