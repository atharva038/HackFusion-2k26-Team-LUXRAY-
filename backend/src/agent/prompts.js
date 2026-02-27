/**
 * System prompt and tool definitions for the AI Pharmacist orchestrator.
 */

const SYSTEM_PROMPT = `You are an autonomous AI pharmacist assistant. Your job is to:
1. Understand conversational medicine orders from patients.
2. Use tools to check inventory, validate prescriptions, and create orders.
3. Always verify prescription requirements before dispensing controlled medicines.
4. Provide clear, professional responses with reasoning.
5. If a medicine requires a prescription and the patient doesn't have one, politely decline and explain why.
6. Log all decisions transparently for auditability.

IMPORTANT RESPONSE RULES:
- Keep ALL responses under 500 characters. Be concise and direct.
- Your responses will be spoken aloud via voice synthesis, so write in a natural conversational tone.
- Avoid unnecessarily long lists, but if asking multiple questions, ALWAYS format them as a clear numbered markdown list with line breaks between items, like this:
  1. First question
  2. Second question
- Never repeat information the patient already knows.
- Be concise, professional, and empathetic. Never guess — always use tools to verify.`;

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'check_inventory',
      description: 'Check if a medicine is available in the pharmacy inventory and its current stock level.',
      parameters: {
        type: 'object',
        properties: {
          medicineName: { type: 'string', description: 'Name of the medicine to check' },
          dosage: { type: 'string', description: 'Dosage strength (e.g. 5mg, 10mg)' },
        },
        required: ['medicineName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_prescription',
      description: 'Validate whether a prescription is required for a medicine and if the patient has a valid one on file.',
      parameters: {
        type: 'object',
        properties: {
          medicineName: { type: 'string', description: 'Name of the medicine' },
          patientId: { type: 'string', description: 'Patient identifier (optional)' },
        },
        required: ['medicineName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: 'Create a new pharmacy order for a patient after validation.',
      parameters: {
        type: 'object',
        properties: {
          medicineName: { type: 'string', description: 'Name of the medicine' },
          dosage: { type: 'string', description: 'Dosage' },
          quantity: { type: 'number', description: 'Number of units' },
          patientName: { type: 'string', description: 'Patient name' },
        },
        required: ['medicineName', 'quantity', 'patientName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_warehouse',
      description: 'Check external warehouse availability when local stock is low.',
      parameters: {
        type: 'object',
        properties: {
          medicineName: { type: 'string', description: 'Name of the medicine' },
        },
        required: ['medicineName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_refill_eligibility',
      description: 'Check if a patient is eligible for a prescription refill based on their refill history.',
      parameters: {
        type: 'object',
        properties: {
          patientName: { type: 'string', description: 'Patient name' },
          medicineName: { type: 'string', description: 'Medicine to refill' },
        },
        required: ['patientName', 'medicineName'],
      },
    },
  },
];

export { SYSTEM_PROMPT, TOOL_DEFINITIONS };
