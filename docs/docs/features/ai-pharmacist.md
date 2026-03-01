---
sidebar_position: 1
title: AI Pharmacist (Chat)
---

# AI Pharmacist

The AI Pharmacist is the core of MediSage. It is a **multi-agent system** powered by the **OpenAI Agents SDK** that handles natural-language pharmacy interactions end-to-end.

---

## Demo

| Scenario | Video |
|---|---|
| Chat with AI pharmacist (English) | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_CHAT_EN) |
| Voice order in Hindi | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_CHAT_HI) |
| Pharmacist agent managing inventory | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_PHARMACIST) |

---

## Agent Chain

```
User Message
    │
    ▼
┌──────────────────┐
│   Input Guard    │  ← Detects prompt injection / policy violations
└────────┬─────────┘
         │
    ▼
┌──────────────────────────────────────────┐
│          Parent Orchestrator             │
│  (Decides which child agent to invoke)   │
│                                          │
│  • Chat Parent      → general queries    │
│  • Pharmacist Parent→ clinical queries   │
│  • Notify Parent    → notifications      │
└────────────────────┬─────────────────────┘
                     │
         ┌───────────┼─────────────┐
         ▼           ▼             ▼
  Receptionist   Order Child   Pharmacist Child
  Child          (place order) (drug info, refills)
  (Q&A, search)
         │           │             │
         ▼           ▼             ▼
      Tools       Tools          Tools
  searchMedicine  checkStock    checkRefill
  checkInteract.  createOrder   sendReminder
                  validateRx    searchDrug
         │
    ▼
┌──────────────────┐
│   Output Guard   │  ← Safety / policy check on AI response
└────────┬─────────┘
         │
    ▼
Final Response (+ optional language translation)
    │
    ▼
AgentAuditLog saved to MongoDB
```

---

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Synchronous — returns full response at once |
| `POST` | `/api/chat/stream` | SSE streaming — returns tokens as they generate |

### Request Body

```json
{
  "message": "Do you have Paracetamol 500mg?",
  "sessionId": "optional-existing-session-id",
  "language": "en"
}
```

### Streaming Response

The `/stream` endpoint uses **Server-Sent Events (SSE)**. The client reads using `fetch()` with a `ReadableStream`:

```
data: {"type":"token","content":"Yes, "}
data: {"type":"token","content":"we have Paracetamol..."}
data: {"type":"done","sessionId":"abc123"}
```

---

## Tools Available to Agents

### `checkStock`
Queries the Medicine collection for current stock.

```javascript
Input:  { medicineName: "Paracetamol", pzn: "optional" }
Output: { name, pzn, stock, price, prescriptionRequired, unitType }
```

### `createOrder`
Places an order for the authenticated user.

```javascript
Input:  { items: [{ medicineName, quantity, dosage }] }
Output: { orderId, totalAmount, status, razorpayOrderId }
```

### `validatePrescription`
Checks if user has an active, approved prescription for Rx medicines.

```javascript
Input:  { medicineName, userId }
Output: { valid: bool, prescriptionId, expiresAt }
```

### `searchMedicine`
Fuzzy search across medicine catalog using Fuse.js.

```javascript
Input:  { query: "aspirin" }
Output: [{ name, pzn, price, stock, prescriptionRequired }]
```

### `checkRefill`
Determines if a user is eligible for a refill based on their last order.

```javascript
Input:  { medicineName, userId }
Output: { eligible: bool, daysUntilEligible, lastOrderDate }
```

### `checkWarehouse`
Queries external warehouse for out-of-stock items.

```javascript
Input:  { medicineName, pzn }
Output: { available: bool, estimatedArrival, quantity }
```

---

## Session Management

- Each conversation is a `ChatSession` document in MongoDB
- Sessions are cached in **Redis** for fast retrieval during active chats
- Users can have multiple sessions (sidebar shows session history)
- Session title auto-generated from first message

```javascript
// Cache structure
key:   `session:${userId}:${sessionId}`
value: JSON array of messages
ttl:   1 hour
```

---

## Agent Audit Log

Every agent invocation is logged to `AgentAuditLog`:

```javascript
{
  userId, sessionId,
  userMessage,       // original user input
  agentResponse,     // final output
  agentChain,        // ["ChatParent", "OrderChild"]
  toolsUsed,         // ["checkStock", "createOrder"]
  durationMs,        // total execution time
  status,            // "success" | "error" | "blocked"
  injectionDetected, // true if guard triggered
  inputTokens, outputTokens,
  traces: [{ agent, action, data }]
}
```

Public traces are viewable at `GET /api/traces` (no auth required) and rendered in the admin **Logs** page and the public `AgentTraces` page.

---

## Pharmacist Agent

A separate agent interface available only to admin/pharmacist roles:

- Endpoint: `POST /api/admin/agent/chat` (+ `/stream`)
- Uses `parentPharmacist.parent.agent.js` with clinical-grade system prompt
- **7 specialist child agents** — each handles one narrow task:

| Child Agent | Responsibility |
|---|---|
| `stockAddAgent` | Increase medicine stock |
| `stockReduceAgent` | Decrease medicine stock |
| `orderStatusChangeAgent` | Update order status |
| `inventorySuggestionAgent` | Inventory trends and suggestions |
| `placeOrderAgent` | Place wholesale restock orders |
| `addMedicineAgent` | Add new medicines to catalog |
| `removeMedicineAgent` | Remove medicines from catalog |

- Separate session history under `agentType: "pharmacist"`
- Pharmacist input/output guardrails prevent misuse of clinical tools
