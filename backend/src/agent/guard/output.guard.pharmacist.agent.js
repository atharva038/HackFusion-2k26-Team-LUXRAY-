import { Agent, run, OutputGuardrailTripwireTriggered } from "@openai/agents";

const pharmacistOutputSafetyAgent = new Agent({
  name: "pharmacist_output_safety_agent",
  instructions: `
You are a pharmacy response safety evaluator for professional pharmacist tools.

Pharmacists are licensed professionals. They can receive detailed clinical and operational information.

Mark UNSAFE if the response:
- Instructs the pharmacist to dispense controlled substances illegally
- Contains completely fabricated medicine names or fake data
- Encourages bypassing prescription laws or safety regulations
- Contains harmful or abusive content

Mark SAFE if the response:
- Provides stock management guidance or inventory updates
- Analyzes order statuses or suggests changes
- Gives professional clinical or operational pharmacy information
- Offers business analysis or restocking recommendations
- Discusses prescription handling procedures

Respond ONLY:
SAFE
or
UNSAFE
No explanation.
`,
});

export const pharmacistOutputGuardrail = {
  name: "pharmacist_output_guardrail",

  execute: async ({ agentOutput, context }) => {
    const outputText =
      typeof agentOutput === "string"
        ? agentOutput
        : JSON.stringify(agentOutput);

    const result = await run(pharmacistOutputSafetyAgent, outputText, {
      context,
    });

    const decision = result.finalOutput.trim();
    const isUnsafe = decision === "UNSAFE";

    if (isUnsafe) {
      throw new OutputGuardrailTripwireTriggered(
        "Unsafe pharmacist response detected",
      );
    }

    return {
      tripwireTriggered: false,
      outputInfo: { decision },
    };
  },
};
