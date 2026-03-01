---
sidebar_position: 2
title: Backend Architecture
---

# Backend Architecture

The backend is a **Node.js ESM** application built with Express. It is organized into layers with clear responsibilities.

---

## Demo

[![Backend Architecture Deep Dive](https://img.shields.io/badge/▶_Backend_Deep_Dive-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_BACKEND)

---

## Directory Structure

```
backend/src/
├── agent/                         # AI Agent system (OpenAI Agents SDK)
│   ├── parent/                    # Parent router agents
│   │   ├── parentChat.agent.js              # Routes customer chat intent
│   │   ├── parentNotify.agent.js            # Routes notification tasks
│   │   └── parentPharmacist.parent.agent.js # Routes pharmacist tasks
│   │
│   ├── child/                     # Specialist child agents
│   │   ├── chat/
│   │   │   ├── receptionist.child.js        # Q&A, medicine search, stock info
│   │   │   └── orderMaker.child.js          # Order placement, payment, Rx check
│   │   ├── notify/
│   │   │   ├── medication.notify.child.js          # Daily 8 AM dose reminder emails
│   │   │   ├── refillReminder.notify.child.js      # Daily 10 AM expiry/refill alerts
│   │   │   └── img_data_extractor.notify.child.js  # Prescription OCR extraction
│   │   └── pharamcist/
│   │       ├── stockAdd.child.js
│   │       ├── stockReduce.child.js
│   │       ├── orderStatus.child.js
│   │       ├── inventorySuggestion.child.js
│   │       ├── placeOrder.child.js
│   │       ├── addMedicine.child.js
│   │       └── removeMedicine.child.js
│   │
│   ├── guard/                     # Safety filters
│   │   ├── input.guard.agent.js               # Customer chat input guard
│   │   ├── output.guard.agent.js              # Customer chat output guard
│   │   ├── input.guard.pharmacist.agent.js    # Pharmacist input guard
│   │   └── output.guard.pharmacist.agent.js   # Pharmacist output guard
│   │
│   ├── service/                   # Agent-internal services
│   │   ├── chat.service.js
│   │   ├── pharmacist.service.js
│   │   ├── email.service.js
│   │   └── transactions.service.js
│   │
│   ├── tools/                     # Tool definitions (JSON schemas + handlers)
│   │   ├── chat/                  # 6 chat tools
│   │   │   ├── checkStock.tool.js
│   │   │   ├── searchMedByDescription.tool.js
│   │   │   ├── describeMed.tool.js
│   │   │   ├── order_medicine.tool.js
│   │   │   ├── checkPrescriptionOnFile.tool.js
│   │   │   └── create_payment.tool.js
│   │   ├── notify_tool/           # 5 notification tools
│   │   │   ├── fetchDoses.notify.tool.agent.js
│   │   │   ├── sendEmail.tool.agent.js
│   │   │   ├── fetchRefills.notify.tool.agent.js
│   │   │   ├── OCR.notify.tool.agent.js
│   │   │   └── verifyPrescription.notify.tool.agent.js
│   │   └── pharamcist/            # 7 pharmacist tools
│   │       ├── addStockTool.js
│   │       ├── reduceStockTool.js
│   │       ├── getOrdersTool.js
│   │       ├── changeOrderStatusTool.js
│   │       ├── getRecentTransactionsTool.js
│   │       ├── placeOrderTool.js
│   │       ├── addMedicineTool.js
│   │       └── removeMedicineTool.js
│   │
│   └── AGENT_ARCHITECTURE.md     # Visual Mermaid flowchart
│
├── config/
│   ├── db.js                  # MongoDB connection
│   ├── openai.js              # OpenAI singleton
│   ├── cloudinary.js          # Cloudinary config
│   ├── redis.js               # Redis connection
│   └── socket.js              # Socket.IO server init + all event handlers
│
├── controllers/               # HTTP request handlers
│   ├── auth.controller.js
│   ├── chat.controller.js
│   ├── admin.controller.js
│   ├── user.controller.js
│   ├── payment.controller.js
│   ├── prescription.controller.js
│   ├── pharmacistAgent.controller.js
│   ├── notification.controller.js
│   ├── tts.controller.js
│   └── recording.controller.js
│
├── middleware/
│   ├── auth.middleware.js    # protect + restrictTo
│   ├── multer.middleware.js  # upload (5MB img) + uploadVideo (500MB)
│   ├── validate.middleware.js # Zod schema validation
│   └── redisRateLimiter.js  # Per-user Redis rate limiter
│
├── models/                   # Mongoose schemas (9 models)
│   ├── user.model.js
│   ├── doctor.model.js
│   ├── medicine.model.js
│   ├── order.model.js
│   ├── prescription.model.js
│   ├── chatSession.model.js
│   ├── refill.model.js
│   ├── inventoryLog.model.js
│   └── agentAuditLog.model.js
│
├── routes/                   # Express routers (11 routes)
│   ├── auth.routes.js
│   ├── chat.routes.js
│   ├── admin.routes.js
│   ├── user.routes.js
│   ├── payment.routes.js
│   ├── notification.routes.js
│   ├── tts.routes.js
│   ├── webhook.routes.js
│   ├── trace.routes.js
│   ├── invoice.routes.js
│   └── recording.routes.js
│
├── scheduler/
│   ├── refill.scheduler.js           # Daily refill countdown (node-cron)
│   └── notification.schedule.js      # 8 AM dose reminders + 10 AM refill alerts
│
├── services/                 # Business logic
│   ├── cloudinary.service.js
│   ├── cache.service.js               # Redis chat session cache
│   ├── inventory.service.js
│   ├── order.service.js
│   ├── multilingual.service.js        # Language detection + translation
│   ├── email.fulfillment.service.js
│   ├── whatsapp.service.js            # Twilio WhatsApp
│   ├── warehouse.fulfillment.service.js
│   ├── invoicePdf.service.js          # jsPDF invoice generation
│   └── streamService.js               # SSE / ReadableStream helpers
│
├── utils/
│   ├── logger.js
│   ├── agentLogger.js
│   └── helpers.js
│
├── app.js                    # Express entry + route mounting
├── seed.js                   # DB seed script
└── createAdmin.js            # Admin user creation
```

---

## Middleware Stack (per request)

```
1. CORS                  — Origin whitelist
2. express.json()        — Body parsing (1MB limit)
3. Security headers      — X-Frame-Options, X-XSS-Protection, etc.
4. morgan                — HTTP logging
5. Route-level:
   ├── redisRateLimiter  — Per-user, per-minute limits (Redis)
   ├── protect           — JWT verification → req.user
   ├── restrictTo(roles) — Role authorization
   ├── validate          — Zod input validation
   └── multer            — File upload (if applicable)
6. Controller            — Business logic + response
```

---

## Rate Limits

| Route | Limit | Window |
|---|---|---|
| `POST /api/chat` | 20 req/user | 1 min |
| `POST /api/chat/stream` | 20 req/user | 1 min |
| `POST /api/tts` | 30 req/user | 1 min |
| `POST /api/tts/stream` | 30 req/user | 1 min |
| `POST /api/notification/upload` | 10 req/IP | 1 min |
| `POST /api/auth/*` | 100 req/IP | 15 min |

---

## Agent System

### Flow

```
User message
    │
    ▼
Input Guard (injection detection, policy check)
    │
    ▼
Parent Agent (decides which child to invoke)
    │
    ├── Chat Parent → Receptionist Child
    │                   └─ Tools: checkStock, searchMedByDescription, describeMed
    │
    ├── Chat Parent → Order Maker Child
    │                   └─ Tools: order_medicine, checkPrescriptionOnFile, create_payment
    │
    ├── Pharmacist Parent → 7 specialist child agents
    │                   └─ Tools: addStock, reduceStock, getOrders, changeOrderStatus,
    │                             getRecentTransactions, placeOrder, addMedicine, removeMedicine
    │
    └── Notification Dispatcher → 3 child agents
                        ├─ Medication Notifier  → fetchDoses + sendEmail
                        ├─ Refill Reminder      → fetchRefills + sendEmail
                        └─ Image Data Extractor → OCR_Tool + verifyPrescription
    │
    ▼
Output Guard (safety filter on agent response)
    │
    ▼
Response (optionally translated via multilingual.service)
    │
    ▼
AgentAuditLog saved to MongoDB (tools used, duration, tokens, traces)
```

### Complete Tool Reference

| Pipeline | Tool | Purpose |
|---|---|---|
| **Chat** | `checkStock` | Query medicine inventory by name |
| **Chat** | `searchMedByDescription` | Fuzzy/semantic medicine search |
| **Chat** | `describeMed` | Detailed medicine info + interactions |
| **Chat** | `order_medicine` | Place an order for the authenticated user |
| **Chat** | `checkPrescriptionOnFile` | Verify active Rx for restricted medicines |
| **Chat** | `create_payment` | Create Razorpay payment order |
| **Pharmacist** | `addStockTool` | Increase stock for a medicine |
| **Pharmacist** | `reduceStockTool` | Decrease stock for a medicine |
| **Pharmacist** | `getOrdersTool` | List all orders |
| **Pharmacist** | `changeOrderStatusTool` | Update order status |
| **Pharmacist** | `getRecentTransactionsTool` | Inventory transaction history |
| **Pharmacist** | `placeOrderTool` | Place a wholesale restock order |
| **Pharmacist** | `addMedicineTool` | Add a new medicine to catalog |
| **Pharmacist** | `removeMedicineTool` | Remove a medicine from catalog |
| **Notification** | `fetchDosesTool` | Fetch active prescriptions for dose reminders |
| **Notification** | `sendEmailTool` | Send HTML email via Resend |
| **Notification** | `fetchRefillsTool` | Fetch prescriptions expiring in 1–2 days |
| **Notification** | `OCR_Tool` | Extract text from prescription image (Vision model) |
| **Notification** | `verifyPrescriptionTool` | Validate extracted prescription data |

---

## Socket.IO Setup

Socket server is initialized in `config/socket.js` and shares the HTTP server with Express.

```javascript
// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT → attach socket.userId, socket.role, socket.username
});

// On connection
socket.join(`user:${socket.userId}`);  // Personal room
```

All socket event emissions happen inside controllers (e.g., `admin.controller.js` emits after order status update).

---

## Scheduled Jobs

| Job | Schedule | Action |
|---|---|---|
| Dose reminders | Daily 8:00 AM | AI Medication Notifier fetches active prescriptions → crafts custom HTML email → sends via Resend |
| Refill alerts | Daily 10:00 AM | AI Refill Reminder finds prescriptions expiring in 1–2 days → sends urgent red-themed email |
| Refill countdown | Daily (configurable) | Decrements `daysLeft` on Refill docs; triggers WhatsApp via Twilio when ≤3 days |
| Low-stock sweep | Event-driven | Emails pharmacists when medicine stock drops below threshold |
