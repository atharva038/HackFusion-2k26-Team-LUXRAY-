Perfect.
Now we simplify.

Current working flow:

User → “I want Paracetamol”
Agent → “What dosage and quantity?”
User → “500mg, 2 strips”
Agent → Creates order

Now you want to insert:

💳 Payment step
📄 Invoice step

Without breaking your existing conversation logic.

Good.

---

# 🎯 What You Actually Need To Do

Right now your flow is:

User intent → Collect details → Create order → Done

You must change it to:

User intent
→ Collect details
→ Check stock
→ Create order (status = pending_payment)
→ Trigger payment step
→ Wait for webhook
→ After payment → confirm order + generate invoice

That’s it.

No extra complexity.

---

# 🧠 Updated Conversational Flow (Correct Version)

### Step 1 — User Requests Medicine

User:
“I want Paracetamol.”

Agent:
“What dosage and quantity?”

---

### Step 2 — User Provides Details

User:
“500mg, 2 strips.”

Agent:

1. Calls `checkInventory.tool`
2. Calls `createOrder.tool`
3. Order created with:

```plaintext
status = pending_payment
paymentStatus = pending
```

---

### Step 3 — Agent Immediately Triggers Payment

After order creation:

Agent must automatically:

Call `createPayment.tool`

Tool returns payment link.

Agent responds in chat:

🧾 Order Created
Total: ₹120

💳 Please complete payment to confirm your order:

[Pay Now Button]

---

# 🔥 IMPORTANT CHANGE

Order must NOT be marked confirmed yet.

Order status:

```plaintext
orderStatus = awaiting_payment
paymentStatus = pending
```

---

# 🔔 Step 4 — Payment Webhook

User pays.

Razorpay sends webhook.

Webhook does:

* Verify signature
* Update order.paymentStatus = paid
* Update order.orderStatus = confirmed
* Generate invoice
* Save invoice

---

# 🤖 Step 5 — Agent Sends Final Confirmation

After webhook:

Trigger agent or notification service to send:

✅ Payment Received
📄 Invoice Generated
🔽 Download Invoice

Now order is confirmed.

---

# 🧠 What You Don’t Need

You do NOT need:

* Separate payment agent
* Complex workflow system
* Extra conversation loop

Just add:

Payment stage after order creation.

---

# 🏗 Clean Architecture Update

Old Flow:
Agent → createOrder → Done

New Flow:
Agent → createOrder → createPayment → Wait webhook → Confirm → Generate invoice

Only one new branch.

---

# 🧾 Order State Machine (Very Important)

Implement clear states:

```plaintext
draft
awaiting_payment
paid
confirmed
shipped (future)
delivered (future)
```

Payment status:

```plaintext
pending
paid
failed
```

Never mix orderStatus and paymentStatus.

---

# 💬 Final Clean Chat Example

User:
“I want Paracetamol 500mg 2 strips.”

AI:
🧾 Order Created
Total: ₹120

💳 Please complete payment below:
[Pay Now]

(User pays)

AI:
✅ Payment confirmed.
📄 Invoice generated.
🔽 Download Invoice

Simple. Clean. Correct.

---

# 🎯 What You Should Implement Next

1. Update order schema with payment fields
2. Insert payment step after order creation
3. Implement webhook
4. Trigger confirmation message
5. Add invoice download

Nothing else.

---