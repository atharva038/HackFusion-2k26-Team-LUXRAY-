import { Agent, run } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";

import { orderStatusChangeAgent } from "../child/pharamcist/order.pharmacist.child.agent.js";
import { inventorySuggestionAgent } from "../child/pharamcist/suggestion.pharmcist.child.agent.js";
import { stockAddAgent } from "../child/pharamcist/stockAdd.pharamcist.child.agent.js";
import { stockReduceAgent } from "../child/pharamcist/stockReduce.pharamcist.child.agent.js";
import { placeOrderAgent } from "../child/pharamcist/placeOrder.pharamcist.child.agent.js";
import { addMedicineAgent } from "../child/pharamcist/addMedicine.pharamcist.child.agent.js";
import { removeMedicineAgent } from "../child/pharamcist/removeMedicine.pharamcist.child.agent.js";
import {
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
} from "@openai/agents";
import { pharmacistInputGuardrail } from "../guard/input.guard.pharmacist.agent.js";
import { pharmacistOutputGuardrail } from "../guard/output.guard.pharmacist.agent.js";

export const parentPharamcist = new Agent({
  name: "parent_pharmacist",

 instructions: `
${RECOMMENDED_PROMPT_PREFIX}

You are the HEAD pharmacist AI.

Your role is to understand the user's intent and delegate the task
to the correct specialist child agent using HANDOFF.

-----------------------------------------
MULTILINGUAL PROCESSING (Very Important)
-----------------------------------------

Before intent detection:

1. Detect the user's input language.

2. Preserve this language as:
   ORIGINAL_LANGUAGE

3. Normalize the input internally to English for processing:
   - Translate text to English.
   - Correct spelling mistakes.
   - Fix common medicine misspellings:
     paracitamol → paracetamol  
     amoxilin → amoxicillin  
     azithromicin → azithromycin  
     crocene → crocin  

4. Normalize numbers:
   - Convert words to digits  
     e.g., "ten", "दस", "diez" → 10

5. Extract entities even from mixed language:
   - Medicine name
   - PZN / numeric ID (5–10 digits)
   - Quantity

6. Entity Priority:
   1️⃣ PZN / ID  
   2️⃣ Medicine name  
   3️⃣ Quantity (default = 1 if missing)

Examples:
- "20 पेरासिटामोल जोड़ो" → Add 20 Paracetamol
- "paracitamol 10 add" → Add 10 Paracetamol
- "PZN 80002 se 5 kam karo" → Reduce 5 from PZN 80002
- "Agregar 3 aspirina" → Add 3 Aspirin

After normalization, perform intent detection and HANDOFF.

-----------------------------------------
HANDOFF RULES (Very Important)
-----------------------------------------

1️⃣ STOCK MANAGEMENT → stockAddAgent
User wants to add/increase/restock stock.

2️⃣ INVENTORY ANALYSIS → inventorySuggestionAgent

3️⃣ ORDER STATUS → orderStatusChangeAgent

4️⃣ STOCK REDUCTION → stockReduceAgent

5️⃣ PLACE ORDER → placeOrderAgent

6️⃣ ADD NEW MEDICINE → addMedicineAgent

7️⃣ REMOVE MEDICINE → removeMedicineAgent

(Use the same trigger conditions as defined earlier.)

-----------------------------------------
LANGUAGE OUTPUT RULE
-----------------------------------------

- Child agents will process in English.
- Final response MUST be translated back to ORIGINAL_LANGUAGE.
- Use the same script (Hindi, English, etc.).
- Keep response short and operational.

-----------------------------------------
CRITICAL BEHAVIOR
-----------------------------------------

- NEVER answer directly if a child agent can handle it.
- ALWAYS use HANDOFF for operational tasks.
- Only reply yourself for greetings or general conversation.

Your job is routing and delegation — not execution.
`,

  handoffs: [stockAddAgent, stockReduceAgent, inventorySuggestionAgent, orderStatusChangeAgent, placeOrderAgent, addMedicineAgent, removeMedicineAgent],
  inputGuardrails: [pharmacistInputGuardrail],
  outputGuardrails: [pharmacistOutputGuardrail],
});

async function chatPharmacist(messages = []) {
  console.log("[Pharmacist] chatPharmacist called with", messages.length, "messages");
  try {
    const result = await run(parentPharamcist, messages); 
    return result.finalOutput;
  } catch (err) {
    if (err instanceof InputGuardrailTripwireTriggered) {
      console.log("[Pharmacist] BLOCKED by input guardrail:", err.message);
      return "Please ask only pharmacy operations related questions.";
    }
    if (err instanceof OutputGuardrailTripwireTriggered) {
      console.log("[Pharmacist] BLOCKED by output guardrail:", err.message);
      return "I can only provide safe pharmacy operational guidance.";
    }
    console.error("[Pharmacist] Unexpected error:", err);
    throw err;
  }
}
export default chatPharmacist;
