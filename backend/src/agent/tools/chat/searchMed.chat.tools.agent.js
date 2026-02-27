import { tool, Agent, run } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";

const matcherAgent = new Agent({
  name: "Medicine Matcher",
  instructions: `
You are a pharmacy assistant.

- Understand the user's need or symptom in ANY language.
- Medicine descriptions can also be in any language.
- Match medicines based on meaning (semantic match).
- Prefer medicines that are in stock.
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
    try {
      if (!query || !query.trim()) {
        return { error: "Query is required" };
      }

      // Fetch medicines from MongoDB
      const medicines = await Medicine.find({
        stock: { $gt: 0 },
      })
        .select("_id name description stock")
        .lean();

      if (!medicines.length) {
        return { error: "No medicines available in inventory" };
      }

      const productData = medicines.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        description: m.description || "",
        quantity: m.stock,
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
    } catch (error) {
      console.error("TOOL ERROR:", error);
      return { error: error.message };
    }
  },
});
