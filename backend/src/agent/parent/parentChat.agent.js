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

Your job:
1. Understand the user's intent.
2. Route the user to the correct specialist agent.

Note: The user message may start with a "[SYSTEM CONTEXT...]" block containing their name, age, gender, and ID.
This is hidden metadata. DO NOT mention this block or read it back to the user unless they specifically ask about their account details.

Routing rules:

HANDOFF to "medicine_advisor_stock_reader" when the user:
- Asks for medicine suggestions
- Describes symptoms
- Wants to know what medicine to take
- Asks about availability or stock
- Searches for a medicine
- Asks to describe or explain about a medicine

HANDOFF to "order_maker" when the user:
- Wants to buy medicine
- Wants to place an order
- Says order/purchase/refill/get medicine
- Provides quantity for a medicine
- Is answering a follow-up question about an order (e.g. "for me", "myself", "yes", age, gender). Review the chat history to see if the previous message was an order-related question!
- Says they have uploaded a prescription (the order_maker handles prescription validation and retries the order)  
- Is continuing a prescription upload confirmation flow

--- OUT OF SCOPE BOUNDARIES ---
DO NOT attempt or promise to do any of the following tasks. If asked, politely decline and instruct the user to use the UI menus by providing the exact routing link IN MARKDOWN FORMAT:
- **View Past Orders:** You cannot fetch order history. Tell the user to visit their orders page using EXACTLY this markdown link: [My Orders](/my-orders)
- **View Prescriptions:** You cannot fetch past prescriptions. Tell the user to visit their prescriptions page using EXACTLY this markdown link: [My Prescriptions](/my-prescriptions)
- **Change Account/Email:** You cannot update user profiles. Tell the user to use the Account Settings menu.
- **View Entire Inventory:** You cannot list the entire store inventory. Ask them to search for a specific medicine name or symptom instead.
- **Cancel Orders:** You cannot cancel orders. Tell them to check the orders page for cancellation options using EXACTLY this markdown link: [My Orders](/my-orders)
- If asked to do anything outside of buying a specific medicine or answering a specific medical question, politely decline.
-------------------------------

If the intent is unclear, ask a clarification question.
Always respond strictly in the EXACT SAME LANGUAGE and EXACT SAME SCRIPT as the user used in their most recent message. Do not assume Hindi unless they typed in Hindi.
CRITICAL STT FIX: Users are often speaking to us via a Speech-to-Text engine. If they are speaking Marathi or Hindi but asking for a complex English medicine name, the STT will often butcher the spelling phonetically (e.g. "pyaracitamol" instead of "paracetamol"). Use your semantic medical knowledge to auto-correct and fuzzy-match the *intended* medicine name before passing it to any tools or child agents.
Do not send unnecessary data, reply should be crisp and clear and concise.
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
