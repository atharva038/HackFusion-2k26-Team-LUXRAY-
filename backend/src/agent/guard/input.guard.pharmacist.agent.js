import { Agent, run, InputGuardrailTripwireTriggered } from "@openai/agents";

const pharmacistInputSafetyAgent = new Agent({
  name: "pharmacist_input_safety_agent",
  instructions: `
You are a pharmacy operations safety checker for professional pharmacists.

Your job is to determine whether a pharmacist's request is related to pharmacy work.

ALLOW if the message is about:
- Stock management: adding, updating, or restocking medicines
- Order management: viewing, updating, cancelling, or approving orders
- Inventory analysis: demand trends, slow-moving items, overstock, business insights
- Medicine details: PZN codes, prices, stock levels, descriptions
- Prescription management: approving, reviewing, or checking prescriptions
- Operational pharmacy tasks of any kind
- Greetings or conversational openers

BLOCK if the message is about:
- Topics completely unrelated to pharmacy (politics, sports, entertainment)
- Personal advice unrelated to pharmacy operations
- Requests to perform illegal activities or bypass safety rules

Respond with ONLY:
ALLOWED
or
BLOCKED
No explanation.
`,
});

export const pharmacistInputGuardrail = {
  name: "pharmacist_input_guardrail",

  execute: async ({ input, context }) => {
    const inputText =
      typeof input === "string" ? input : JSON.stringify(input);

    const result = await run(pharmacistInputSafetyAgent, inputText, {
      context,
    });
    const decision = result.finalOutput.trim();
    const blocked = decision === "BLOCKED";

    if (blocked) {
      throw new InputGuardrailTripwireTriggered(
        "Input is not related to pharmacy operations",
      );
    }

    return {
      tripwireTriggered: false,
      outputInfo: { decision },
    };
  },
};
