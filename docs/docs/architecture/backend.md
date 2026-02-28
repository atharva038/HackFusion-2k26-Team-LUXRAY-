---
sidebar_position: 2
title: Backend Architecture
---

# Backend Architecture

The backend is a **Node.js ESM** application built with Express. It is organized into layers with clear responsibilities.

---

## Directory Structure

```
backend/src/
├── agent/                    # AI Agent system
│   ├── orchestrator.agent.js # Main agentic loop entry point
│   ├── parent/               # Parent orchestrators
│   │   ├── chat.parent.js
│   │   ├── notify.parent.js
│   │   └── pharmacist.parent.js
│   ├── child/                # Specialist child agents
│   │   ├── order.child.js
│   │   ├── receptionist.child.js
│   │   ├── pharmacist.child.js
│   │   └── notifications.child.js
│   ├── guard/                # Safety filters
│   │   ├── input.guard.js
│   │   └── output.guard.js
│   ├── service/              # Agent-internal services
│   │   ├── chat.service.js
│   │   ├── pharmacist.service.js
│   │   ├── email.service.js
│   │   └── transactions.service.js
│   ├── tools/                # Tool definitions (JSON schemas + handlers)
│   │   ├── chat.tools.js
│   │   ├── pharmacist.tools.js
│   │   └── notify.tools.js
│   └── prompts.js            # System prompts for all agents
│
├── config/
│   ├── db.js                 # MongoDB connection
│   ├── openai.js             # OpenAI singleton
│   ├── cloudinary.js         # Cloudinary config
│   ├── redis.js              # Redis connection
│   └── socket.js             # Socket.IO server init + all event handlers
│
├── controllers/              # HTTP request handlers
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
├── models/                   # Mongoose schemas
│   ├── user.model.js
│   ├── medicine.model.js
│   ├── order.model.js
│   ├── prescription.model.js
│   ├── chatSession.model.js
│   ├── refill.model.js
│   ├── inventoryLog.model.js
│   └── agentAuditLog.model.js
│
├── routes/                   # Express routers
│   ├── auth.routes.js
│   ├── chat.routes.js
│   ├── admin.routes.js
│   ├── user.routes.js
│   ├── payment.routes.js
│   ├── notification.routes.js
│   ├── tts.routes.js
│   ├── webhook.routes.js
│   ├── trace.routes.js
│   └── recording.routes.js
│
├── scheduler/
│   ├── refill.scheduler.js   # Daily refill alerts (node-cron)
│   └── notification.schedule.js
│
├── services/                 # Business logic
│   ├── cloudinary.service.js
│   ├── cache.service.js      # Redis session cache
│   ├── inventory.service.js
│   ├── order.service.js
│   ├── multilingual.service.js
│   ├── email.service.agent.js
│   ├── whatsapp.service.js
│   ├── invoicePdf.service.js
│   └── streamService.js
│
├── tools/                    # Agent tool implementations
│   ├── inventory.tool.js
│   ├── order.tool.js
│   ├── prescription.tool.js
│   ├── refill.tool.js
│   └── warehouse.tool.js
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
| `POST /api/prescription/upload` | 10 req/IP | 1 min |
| `POST /api/auth/*` | 100 req/IP | 15 min |

---

## Agent System Architecture

```
User message
    │
    ▼
Input Guard (injection detection, policy check)
    │
    ▼
Parent Orchestrator (decides which child to invoke)
    │
    ├── Chat Parent → Receptionist Child
    │                    └─ Tools: searchMedicine, checkInteractions
    │
    ├── Chat Parent → Order Child
    │                    └─ Tools: checkStock, createOrder, validatePrescription
    │
    └── Pharmacist Parent → Pharmacist Child
                             └─ Tools: checkRefill, sendReminder, searchDrug
    │
    ▼
Output Guard (safety filter on agent response)
    │
    ▼
Response (optionally translated via multilingual.service)
    │
    ▼
AgentAuditLog saved (tools used, duration, tokens, traces)
```

### Tool Definitions

Each tool is a JSON schema registered with the OpenAI Agents SDK:

| Tool | Purpose |
|---|---|
| `checkStock` | Query medicine inventory by name or PZN |
| `createOrder` | Place an order for the authenticated user |
| `validatePrescription` | Check if user has valid prescription for Rx medicines |
| `searchMedicine` | Fuzzy search medicine catalog |
| `checkRefill` | Check refill eligibility based on last order date |
| `checkWarehouse` | Query external warehouse for out-of-stock items |

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
| Refill countdown | Daily (configurable) | Checks active RefillAlerts, sends email/WhatsApp if ≤3 days |
| Low-stock sweep | On-demand (manual trigger) | Emails pharmacists about medicines below threshold |
