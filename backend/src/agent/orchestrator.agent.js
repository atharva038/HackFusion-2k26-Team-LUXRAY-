import { openai  } from '../config/openai.js';
import { SYSTEM_PROMPT, TOOL_DEFINITIONS  } from './prompts.js';
import * as inventoryTool from '../tools/inventory.tool.js';
import * as prescriptionTool from '../tools/prescription.tool.js';
import * as orderTool from '../tools/order.tool.js';
import * as warehouseTool from '../tools/warehouse.tool.js';
import * as refillTool from '../tools/refill.tool.js';
import logger from '../utils/logger.js';

// Map tool names to their handler functions
const TOOL_HANDLERS = {
  check_inventory: inventoryTool.checkInventory,
  validate_prescription: prescriptionTool.validatePrescription,
  create_order: orderTool.createOrder,
  check_warehouse: warehouseTool.checkWarehouse,
  check_refill_eligibility: refillTool.checkRefillEligibility,
};

/**
 * Run the AI orchestrator agent.
 * Sends the user message to OpenAI, executes any tool calls, and returns the final response.
 */
async function runOrchestrator(userMessage) {
  const toolCalls = [];

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  // Initial call to OpenAI
  let response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: TOOL_DEFINITIONS,
    tool_choice: 'auto',
  });

  let assistantMessage = response.choices[0].message;

  // Agentic loop — keep executing tool calls until the model stops requesting them
  while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    messages.push(assistantMessage);

    for (const tc of assistantMessage.tool_calls) {
      const handler = TOOL_HANDLERS[tc.function.name];
      if (!handler) {
        logger.warn(`Unknown tool: ${tc.function.name}`);
        continue;
      }

      const args = JSON.parse(tc.function.arguments);
      logger.info(`🛠 Tool call: ${tc.function.name}`, args);

      const result = await handler(args);
      toolCalls.push({ name: tc.function.name, args, result });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }

    // Call OpenAI again with tool results
    response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
    });

    assistantMessage = response.choices[0].message;
  }

  return {
    text: assistantMessage.content,
    toolCalls,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export { runOrchestrator };
