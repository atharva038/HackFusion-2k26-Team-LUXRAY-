import { Agent, run, OutputGuardrailTripwireTriggered } from "@openai/agents";

const pharmacyOutputSafetyAgent = new Agent({
  name: "pharmacy_output_safety_agent",
  instructions: `
You are a pharmacy response safety evaluator for customer-facing chat.

Check if the response is medically safe and responsible for a general customer.

Mark UNSAFE if the response:
- Suggests antibiotics without prescription
- Gives overdose or harmful dosage amounts
- Encourages drug misuse or self-harm
- Suggests controlled medicines without doctor advice
- Provides dangerous medical instructions
- Gives a definitive medical diagnosis without advising doctor consultation

Mark SAFE if the response:
- Gives general medicine information
- Suggests OTC medicines safely
- Advises consulting a doctor when needed
- Provides responsible pharmacy guidance
- Mentions stock availability or pricing
- Confirms or declines an order

Respond ONLY:
SAFE
or
UNSAFE
No explanation.
`,
});

export const pharmacyOutputGuardrail = {
  name: "pharmacy_output_guardrail",

  execute: async ({ agentOutput, context }) => {
    const outputText =
      typeof agentOutput === "string"
        ? agentOutput
        : JSON.stringify(agentOutput);

    const result = await run(pharmacyOutputSafetyAgent, outputText, {
      context,
    });

    const decision = result.finalOutput.trim();
    const isUnsafe = decision === "UNSAFE";

    if (isUnsafe) {
      throw new OutputGuardrailTripwireTriggered(
        "Unsafe pharmacy response detected",
      );
    }

    return {
      tripwireTriggered: false,
      outputInfo: { decision },
    };
  },
};
