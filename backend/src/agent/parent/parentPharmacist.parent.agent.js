import { Agent, run } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";

import { orderStatusChangeAgent } from "../child/pharamcist/order.pharmacist.child.agent.js";
import { inventorySuggestionAgent } from "../child/pharamcist/suggestion.pharmcist.child.agent.js";
import { stockAddAgent } from "../child/pharamcist/stockAdd.pharamcist.child.agent.js";
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

  handoffs: [stockAddAgent, inventorySuggestionAgent, orderStatusChangeAgent],
  inputGuardrails: [pharmacistInputGuardrail],
  outputGuardrails: [pharmacistOutputGuardrail],
});

async function chatPharmacist(messages = []) {
  try {
    const result = await run(parentPharamcist, messages);
    
    console.log(result.finalOutput);
    return result.finalOutput;
  } catch (err) {
    if (err instanceof InputGuardrailTripwireTriggered) {
      return "Please ask only pharmacy operations related questions.";
    }
    if (err instanceof OutputGuardrailTripwireTriggered) {
      return "I can only provide safe pharmacy operational guidance.";
    }

    throw err;
  }
}
export default chatPharmacist;
