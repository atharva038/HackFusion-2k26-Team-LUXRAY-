import { Agent, run, InputGuardrailTripwireTriggered } from "@openai/agents";

const pharmacyInputSafetyAgent = new Agent({
  name: "pharmacy_input_safety_agent",
  instructions: `
You are a strict pharmacy input safety checker.

Your job is to determine whether the user's message is related ONLY to pharmacy or medicine.

ALLOW if the message is about:
- Medicine names, dosage, side effects, precautions
- Symptoms and asking for medicine suggestions
- Medicine alternatives or comparisons
- Medicine availability or stock
- Ordering, buying, cancelling, or tracking medicine
- Prescription or pharmacy-related queries

BLOCK if the message is about:
- Programming, technology, coding
- Politics, entertainment, sports, general chat
- Non-medical products
- Harmful or illegal drug misuse
- Any topic not related to pharmacy or medicine

Respond with ONLY:
ALLOWED
or
BLOCKED
No explanation.
`,
});

export const pharmacyInputGuardrail = {
  name: "pharmacy_input_guardrail",

  execute: async ({ input ,context}) => {
    const result = await run(pharmacyInputSafetyAgent, input,{context});
    const decision = result.finalOutput.trim();

    const blocked = decision === "BLOCKED";

    if (blocked) {
      throw new InputGuardrailTripwireTriggered(
        "Input is not related to pharmacy or medicine"
      );
    }

    return {
      safe: !blocked,
      tripwireTriggered: blocked,
      triggered: blocked,
    };
  },
};