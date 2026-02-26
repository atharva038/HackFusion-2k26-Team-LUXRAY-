import chatPharma from "./src/agent/parent/parentChat.agent.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  try {
    const res = await chatPharma([
      { role: "user", content: "hello" },
      { role: "assistant", content: [{ type: "output_text", text: "How can I help you?" }] },
      { role: "user", content: "give me Pantoprazole" },
      { role: "assistant", content: [{ type: "output_text", text: "Are you ordering Pantoprazole for yourself or for someone else?" }] },
      { role: "user", content: "yes" },
      { role: "assistant", content: [{ type: "output_text", text: "Are you looking to place a medicine order for yourself or for someone else?" }] },
      { role: "user", content: "for myself" },
    ]);
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
  mongoose.disconnect();
}
test();
