import { Agent, run, tool } from "@openai/agents";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { addStockTool } from "../../tools/pharamcist/addStockTool.pharamcist.tool.agent.js";

dotenv.config();

export const stockAddAgent = new Agent({
  name: "Stock Manager",
  instructions: `
You are a pharmacy stock assistant.
- You can add stock to medicines using their PZN, name, or ID.
- You must validate quantity and medicine existence.
- Respond with the updated stock information.

### LANGUAGE RULES:
- **Strictly mirror the language used by the user in their query.**
- If the user asks in English, reply in English. 
- If the user asks in Hindi, reply in Hindi.
- Never switch to German or any other language unless the user does first.
- First, understand the query before acting.`,
  tools: [addStockTool],
});
// const connectDB = async () => {
//   try {
//     await mongoose.connect(
//       "mongodb+srv://atharvsjoshi2005_db_user:dX64qfEeRpzcHn5O@cluster0.sfxcubk.mongodb.net/hackfusion-2k26?appName=Cluster0",
//     );
//     console.log("MongoDB Connected");
//   } catch (err) {
//     console.error("MongoDB connection error:", err.message);
//     process.exit(1);
//   }
// };

// await connectDB();

// async function chatPharmacist(messages = []) {
//   const result = await run(stockAddAgent, messages);
//   console.log(result.finalOutput);
//   return result.finalOutput;
// }
// chatPharmacist("add 10 unit pzn is 80002 ");
