import { Agent, run, InputGuardrailTripwireTriggered } from "@openai/agents";

const pharmacyInputSafetyAgent = new Agent({
  name: "pharmacy_input_safety_agent",
  instructions: `
You are a strict pharmacy input safety checker for customer-facing chat.

Your job is to determine whether the user's message is related to pharmacy or medicine.

ALLOW if the message is about:
- Medicine names, dosage, side effects, precautions
- Symptoms and asking for medicine suggestions
- Medicine alternatives or comparisons
- Medicine availability or stock
- Ordering, buying, cancelling, or tracking medicine
- Prescription or pharmacy-related queries
- Greetings, farewells, or conversational messages (hi, hello, thanks, help, bye, goodbye, see you, take care, ok, okay, yes, no, sure, got it, thank you)

BLOCK if the message is about:
- Programming, technology, coding (unrelated to pharmacy)
- Politics, entertainment, sports, general trivia
- Non-medical products
- Harmful or illegal drug misuse
- Any topic clearly unrelated to pharmacy or medicine

Respond with ONLY:
ALLOWED
or
BLOCKED
No explanation.
`,
});

export const pharmacyInputGuardrail = {
  name: "pharmacy_input_guardrail",

  execute: async ({ input, context }) => {
    const inputText =
      typeof input === "string" ? input : JSON.stringify(input);

    const result = await run(pharmacyInputSafetyAgent, inputText, { context });
    const decision = result.finalOutput.trim();
    const blocked = decision === "BLOCKED";

    if (blocked) {
      throw new InputGuardrailTripwireTriggered(
        "Input is not related to pharmacy or medicine",
      );
    }

    return {
      tripwireTriggered: false,
      outputInfo: { decision },
    };
  },
};
