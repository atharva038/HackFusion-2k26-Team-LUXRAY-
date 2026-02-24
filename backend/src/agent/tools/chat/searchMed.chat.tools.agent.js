import { tool, Agent, run } from "@openai/agents";
import { z } from "zod";
import { loadProducts } from "../../service/loadInfo.service.agent.js";

const matcherAgent = new Agent({
  name: "Medicine Matcher",
  instructions: `
You are a pharmacy assistant.

- Understand the user's need or symptom in ANY language.
- Medicine descriptions can also be in any language.
- Match medicines based on meaning (semantic match).
- Return only relevant medicines.

Output format:
JSON array with:
id, name, reason

If nothing matches, return [].
`,
});

export const searchMedByDescription = tool({
  name: "search_medicine_by_need",
  description:
    "Find medicines based on user symptoms or needs. Works for any language query and description.",

  parameters: z.object({
    query: z.string().describe("User symptom or need (any language)"),
  }),

  execute: async ({ query }) => {
    const products = await loadProducts(2);

    if (!query) {
      return { error: "Query is required" };
    }

    const productData = products.map((p) => ({
      id: p["product id"],
      name: p["product name"],
      description: p["descriptions"],
      quantity: p.Current_Quantity ?? 0,
    }));

    const prompt = `
User need: "${query}"

Medicines:
${JSON.stringify(productData)}

Return matching medicines only.
Respond strictly in JSON array.
`;

    const result = await run(matcherAgent, prompt);

    try {
      return JSON.parse(result.finalOutput);
    } catch {
      return { message: result.finalOutput };
    }
  },
});
