import chatPharma from "./src/agent/parent/parentChat.agent.js";
async function test() {
  try {
    const res = await chatPharma([
      { role: "user", content: "hello" },
      { role: "assistant", content: [{ type: "output_text", text: "hi there" }] },
      { role: "user", content: "what is for stomach ache?" }
    ]);
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
