import { config } from "dotenv";
import { Agent, run } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";
import receptionist from "../child/chat/receptionist.chat.child.agent.js";
import orderAgent from "../child/chat/order.chat.child.agent.js";

config();

const parentAgent = new Agent({
  name: "Parent_Agent",

  instructions: `
${RECOMMENDED_PROMPT_PREFIX}

You are the main customer-facing pharmacy assistant.

Your job:
1. Understand the user's intent.
2. Route the user to the correct specialist agent.

Routing rules:

HANDOFF to "medicine_advisor_stock_reader" when the user:
- Asks for medicine suggestions
- Describes symptoms
- Wants to know what medicine to take
- Asks about availability or stock
- Searches for a medicine
- ask to describe or explain about medicine

HANDOFF to "order_maker" when the user:
- Wants to buy medicine
- Wants to place an order
- Says order/purchase/refill/get medicine
- Provides quantity for a medicine

If the intent is unclear, ask a clarification question.
Always respond in English.
`,

  handoffDescription: `
Routes customer queries to the correct pharmacy agent:
- medicine_advisor_stock_reader → search, recommendation, stock
- order_maker → purchase and order placement
`,

  handoffs: [receptionist, orderAgent],
});

async function chat(q = "") {
  const result = await run(parentAgent, q);
  return result.finalOutput;
}

export { parentAgent, chat };
