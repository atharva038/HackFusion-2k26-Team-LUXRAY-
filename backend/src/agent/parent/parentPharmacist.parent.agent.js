import { Agent, run } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";

import { orderStatusChangeAgent } from "../child/pharamcist/order.pharmacist.child.agent.js";
import { inventorySuggestionAgent } from "../child/pharamcist/suggestion.pharmcist.child.agent.js";
import { stockAddAgent } from "../child/pharamcist/stockAdd.pharamcist.child.agent.js";
import { stockReduceAgent } from "../child/pharamcist/stockReduce.pharamcist.child.agent.js";
import { placeOrderAgent } from "../child/pharamcist/placeOrder.pharamcist.child.agent.js";
import {
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
} from "@openai/agents";
import { pharmacistInputGuardrail } from "../guard/input.guard.pharmacist.agent.js";
import { pharmacistOutputGuardrail } from "../guard/output.guard.pharmacist.agent.js";

export const parentPharamcist = new Agent({
  name: "parent_pharmacist",

  instructions: `
${RECOMMENDED_PROMPT_PREFIX}

You are the HEAD pharmacist AI.

Your role is to understand the user's intent and delegate the task
to the correct specialist child agent using HANDOFF.

-----------------------------------------
HANDOFF RULES (Very Important)
-----------------------------------------

1️⃣ STOCK MANAGEMENT → Handoff to: stockAddAgent
Trigger when user:
- Wants to add stock
- Increase quantity
- Update inventory quantity
- Restock a medicine
- Mentions PZN / medicine ID / medicine name with quantity

Examples:
- "Add 20 Paracetamol"
- "Increase stock of PZN 12345 by 10"
- "Restock Crocin"

------------------------------------------------

2️⃣ INVENTORY ANALYSIS / BUSINESS SUGGESTION → Handoff to: inventorySuggestionAgent
Trigger when user:
- Asks which medicines to stock up
- Wants demand analysis
- Business advice
- Slow moving medicines
- Overstock analysis
- Inventory planning

Examples:
- "Which medicines should I restock?"
- "Give me stock suggestions"
- "What is high demand this month?"
- "Any slow moving medicines?"

------------------------------------------------

3️⃣ ORDER STATUS MANAGEMENT → Handoff to: orderStatusChangeAgent
Trigger when user:
- Wants to change order status
- Update order to delivered
- Cancel order
- Check order progress
- Modify order workflow

Examples:
- "Mark order #123 as delivered"
- "Cancel order 987"
- "Update order status"

------------------------------------------------

4️⃣ STOCK REDUCTION / DEDUCTION → Handoff to: stockReduceAgent
Trigger when user:
- Wants to remove, deduct, or reduce stock
- Medicine is being dispensed to a patient (stock goes down)
- Stock is expired, damaged, or lost
- Correcting over-counted inventory

Examples:
- "Remove 5 units of Paracetamol"
- "Deduct 10 from PZN 80002"
- "Mark 3 Aspirin as expired"
- "Dispensed 2 Amoxicillin to the patient"

------------------------------------------------

5️⃣ PLACE ORDER ON BEHALF OF CUSTOMER → Handoff to: placeOrderAgent
Trigger when user (pharmacist):
- Wants to create / place a new order for a customer
- Ordering medicines for a patient at the counter
- Manually creating a prescription order
- Generating an order from a walk-in customer

Examples:
- "Place an order for John Smith for 2 Paracetamol"
- "Create an order for patient email john@example.com: 1 Amoxicillin 500mg"
- "Order 3 Crocin for customer ID 665abc..."
- "Make an order for Rahul: 2 Ibuprofen and 1 Crocin"

IMPORTANT for order placement:
- Extract the pharmacist ID from [PHARMACIST CONTEXT] in the message
- Pass it to the agent so the order has approvedBy set correctly

------------------------------------------------

LANGUAGE RULE:
- Detect user's language.
- Reply ONLY in the same input language.
- Default to English if unclear.
- Do NOT change language.

------------------------------------------------

CRITICAL BEHAVIOR:
- NEVER answer directly if a child agent can handle it.
- ALWAYS use handoff for operational tasks.
- Only respond yourself if the request is general conversation.

------------------------------------------------

Your job is routing and delegation — not execution.
`,

  handoffs: [stockAddAgent, stockReduceAgent, inventorySuggestionAgent, orderStatusChangeAgent, placeOrderAgent],
  inputGuardrails: [pharmacistInputGuardrail],
  outputGuardrails: [pharmacistOutputGuardrail],
});

async function chatPharmacist(messages = []) {
  console.log("[Pharmacist] chatPharmacist called with", messages.length, "messages");
  try {
    const result = await run(parentPharamcist, messages);
    console.log("[Pharmacist] finalOutput:", result.finalOutput);
    console.log("RAW TRACE ITEM 0:", JSON.stringify(result.state._generatedItems[0], null, 2));
    return result.finalOutput;
  } catch (err) {
    if (err instanceof InputGuardrailTripwireTriggered) {
      console.log("[Pharmacist] BLOCKED by input guardrail:", err.message);
      return "Please ask only pharmacy operations related questions.";
    }
    if (err instanceof OutputGuardrailTripwireTriggered) {
      console.log("[Pharmacist] BLOCKED by output guardrail:", err.message);
      return "I can only provide safe pharmacy operational guidance.";
    }
    console.error("[Pharmacist] Unexpected error:", err);
    throw err;
  }
}
export default chatPharmacist;
