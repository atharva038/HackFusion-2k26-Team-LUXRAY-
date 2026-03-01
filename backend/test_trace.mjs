import { parentAgent } from './src/agent/parent/parentChat.agent.js';
import { run } from "@openai/agents";
import fs from "fs";

async function test() {
    console.log("Running agent...");
    try {
        const result = await run(parentAgent, [{role: "user", content: "What is Paracetamol?"}]);
        
        fs.writeFileSync("trace_dump.json", JSON.stringify(result.state._generatedItems, null, 2));
        console.log("Dumped traces to trace_dump.json");
    } catch (e) {
        console.error(e);
    }
}

test();
