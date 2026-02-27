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

If the intent is unclear, ask a clarification question.
Always respond in the language the user is using.
`,

  handoffDescription: `
Routes customer queries to the correct pharmacy agent:
- medicine_advisor_stock_reader → search, recommendation, stock
- order_maker → purchase, order placement, and prescription validation for controlled medicines
`,

  handoffs: [receptionist, orderAgent],
  inputGuardrails: [pharmacyInputGuardrail],
  outputGuardrails: [pharmacyOutputGuardrail],
});


async function chatPharma(messages = []) {
  try {
    const result = await run(parentAgent, messages);
    console.log(result.finalOutput);
    return result.finalOutput;
  } catch (err) {
    if (err instanceof InputGuardrailTripwireTriggered) {
      return "Please ask only safe medicine or pharmacy related questions.";
    }
    if (err instanceof OutputGuardrailTripwireTriggered) {
      return "I can only provide safe pharmacy-related information. Please consult a doctor for medical advice.";
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
