import { searchMedByDescription } from "./src/agent/tools/chat/searchMed.chat.tools.agent.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  try {
    const res = await searchMedByDescription({ query: "stomach ache" });
    console.log("Tool Result:", res);
  } catch (err) {
    console.error("Tool Error:", err);
  }
  mongoose.disconnect();
}
test();
