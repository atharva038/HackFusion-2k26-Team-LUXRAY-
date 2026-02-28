
---

# 🎯 MASTER PROMPT — Enable Multi-Medicine Ordering & Prescription-Based Bulk Orders

Copy everything below:

---

**Prompt:**

Enhance the AI ordering system to properly support multi-medicine orders.

Currently, when a user:

* Orders multiple medicines in one message
* Or orders based on extracted prescription
* Or uploads prescription with multiple medicines

The system creates order for only a single medicine.

This must be fixed.

The agent must correctly handle multiple medicines and create a single consolidated order containing all requested items.

---

# 🎯 Functional Requirements

The system must support:

1️⃣ Ordering multiple medicines in one message
Example:
“I want Paracetamol 500mg and Amlodipine 5mg, 2 strips each.”

2️⃣ Ordering using prescription
Example:
“Order medicines from my uploaded prescription.”

3️⃣ Ordering using refill
Example:
“Reorder my last prescription.”

All medicines must be added into a single order object.

---

# 🧠 Agent Layer Changes

The agent must:

* Extract all medicine entities from user message
* Validate dosage and quantity for each medicine
* Ask clarification per medicine if needed
* Create structured list:

Example internal format:

[
{ name: "Paracetamol", dosage: "500mg", quantity: 2 },
{ name: "Amlodipine", dosage: "5mg", quantity: 2 }
]

Then call createOrder.tool with full array.

Agent must NOT call tool multiple times for each medicine separately.

Single consolidated call only.

---

# 🧱 Tool Layer Update

Update:

createOrder.tool

It must accept:

items: array of medicines

Not single medicine.

Tool must forward entire array to order.service.

---

# 🏗 Service Layer Update

order.service must:

* Loop through all medicines
* Validate stock for each
* Deduct stock for each (after payment)
* Calculate total price for all items
* Store order with items array
* Store aggregated totalAmount

Order schema must support:

items: [
{
medicineId,
name,
dosage,
quantity,
pricePerUnit,
totalPrice
}
]

Total amount must be sum of all items.

---

# 💳 Payment Integration Update

Payment must:

* Be based on totalAmount of all medicines
* Generate single Razorpay order
* Not split per medicine

---

# 📄 Invoice Update

Invoice must list:

All medicines separately:

Medicine | Dosage | Qty | Unit Price | Total

Final invoice total = sum of all medicines.

---

# 📦 Prescription-Based Ordering

If user says:

“Order medicines from prescription.”

System must:

1. Fetch extracted prescription data
2. Convert medicines into structured items array
3. Ask for missing quantities if needed
4. Confirm full list before order creation
5. Create single consolidated order

Do NOT create separate orders per medicine.

---

# 🧠 Edge Cases To Handle

* One medicine out of stock
* Partial availability
* Different dosages requested
* Missing quantity
* Prescription missing dosage

Agent must:

Clarify missing fields before creating order.

---

# 💬 Chat Behavior

After multi-medicine order creation:

Show structured summary:

🧾 Order Summary

| Medicine    | Dosage | Qty | Price |
| ----------- | ------ | --- | ----- |
| Paracetamol | 500mg  | 2   | ₹40   |
| Amlodipine  | 5mg    | 2   | ₹80   |

Total: ₹120

Then trigger payment.

---

# 🏆 Expected Result

User can:

* Order multiple medicines in single sentence
* Order full prescription in one command
* Get consolidated order
* Pay once
* Get single invoice

System behaves like real pharmacy checkout.

---

# 🎯 Architectural Constraint

Agent → createOrder.tool (once)
Tool → order.service (once)
Service → DB write (single order document)

Never create one order per medicine.

---
