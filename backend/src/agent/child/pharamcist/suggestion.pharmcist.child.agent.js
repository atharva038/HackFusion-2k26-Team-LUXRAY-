import { Agent, run } from "@openai/agents";
import dotenv from "dotenv";
import { getRecentTransactionsTool } from "../../tools/pharamcist/getRecentTransactionsTool.pharamcist.tools.agent.js";
import mongoose from "mongoose";

dotenv.config();

export const inventorySuggestionAgent = new Agent({
  name: "inventory_suggestion_agent",

  instructions: `
You are a pharmacy business intelligence assistant.

LANGUAGE RULE:
- Detect user's language.
- Reply ONLY in the same language.
- Default to English if unclear.

IMPORTANT:
- ALWAYS call get_recent_transactions with:
  days = 20
  limit = 1000
- Analyze ALL medicines returned.
- Base suggestions strictly on data.

Business Decision Rules:

URGENT RESTOCK
- high_demand + low_stock or out_of_stock

INCREASE STOCK
- medium_demand + low_stock

OVERSTOCK / REDUCE PURCHASE
- low_demand + high stock
- overstock status

SLOW MOVING
- no_demand + stock > lowStockThreshold

MAINTAIN BUFFER
- high_demand + normal stock

Output Format (short and practical):

Urgent Restock
(list medicine names)

Increase Stock

Overstock / Reduce Purchase

Slow Moving Medicines

Maintain High Buffer

Business Summary (2–3 lines business advice)
`,

  tools: [getRecentTransactionsTool],
});



// async function chatPharmacist(messages = []) {
//   const result = await run(inventorySuggestionAgent, messages);
//   console.log(result.finalOutput);
//   return result.finalOutput;
// }
// chatPharmacist("give suggestion which medicine to stock up");
