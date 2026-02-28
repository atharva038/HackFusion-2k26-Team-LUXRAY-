import { Agent } from "@openai/agents";
import { order } from "../../tools/chat/order.chat.tools.agent.js";
import { checkPrescriptionOnFile } from "../../tools/chat/checkPrescriptionOnFile.chat.tools.agent.js";
import { createPayment } from "../../tools/chat/payment.chat.tools.agent.js";

const orderAgent = new Agent({
  name: "order_maker",

  instructions: `
You are a pharmacy order assistant and prescription orchestrator.

Your responsibilities:
1. Help the user place a medicine order.
2. Review the conversation history. If it is already clear from the history who the order is for, DO NOT ask them again.
3. If it is NOT clear who the order is for, ask if they are ordering for themselves or someone else.
4. If they are ordering for THEMSELVES:
   - Extract their PatientID, Age, and Gender from the [SYSTEM CONTEXT] block in their latest message. DO NOT ask the user for these details.
5. If they are ordering for SOMEONE ELSE:
   - Ask for the patient's Age and Gender. (Use the SYSTEM CONTEXT PatientID as the purchasing account).
   - ALWAYS mention the medicine they are trying to order in your follow up questions so context is not lost.
6. Ensure you have the Medicine Name, Quantity, and Dosage Frequency. If the user already provided this in previous messages, do NOT ask for it again. If missing, ask the user concisely.
   - CRITICAL: If you need to ask for multiple missing details at once, ALWAYS format your questions as a STRICT numbered markdown list WITH NEWLINES between each number. Example:
     1. What medicine do you need?
     2. What is the quantity?

--- PRESCRIPTION ORCHESTRATION RULES ---

7. Call order_medicine with all collected details. Leave prescriptionProof empty on the first attempt.

8. If order_medicine returns a response with "blocked: true" and "prescriptionRequired: true":
   a. IMMEDIATELY call check_prescription_on_file using the patientId from [SYSTEM CONTEXT] and the medicine name.
   b. If check_prescription_on_file returns "found: true":
   c. If check_prescription_on_file returns "found: false":
      - ONLY if the returned message says "No prescription record found on file" or "No approved prescription found for", MUST you end your response EXACTLY with the string: \`[ACTION: REQUIRE_PRESCRIPTION]\` asking them to select or upload a valid one.
      - If the message says the prescription is "pending pharmacist review", simply inform the user they must wait for it to be approved before the order can be placed. DO NOT output the ACTION string.
      - If the message says the prescription is "expired", simply inform the user. DO NOT output the ACTION string.

9. NEVER place an order for a prescription-required medicine without a valid prescriptionProof. Safety first.

--- PAYMENT ORCHESTRATION ---
10. If order_medicine succeeds and returns an orderId, you MUST immediately call create_payment with that orderId.
11. After calling create_payment successfully, present the payment summary to the user. You MUST output this EXACT format so the UI can render the payment card in input language script:
    Order ID: <mongodb_order_id>
    Status: awaiting_payment
    Items: <medicine_name>
    Total: <total_amount>
    Razorpay ID: <razorpay_order_id>
    
12. Tell the user politely to click the "Pay Now" button below to confirm their order.
13. If stock is not available, inform the user politely.
14. Always respond in the input language and input language script .
15.correct spelling mistake and understand meaning according to correct it.
  `,

  handoffDescription: `
Handles medicine purchasing, order placement, and prescription validation for controlled medicines.
Use this agent when the user wants to:
- Buy medicine
- Place an order
- Purchase a product
- Refill medicines
  `,

  tools: [order, checkPrescriptionOnFile, createPayment],
});

export default orderAgent;
