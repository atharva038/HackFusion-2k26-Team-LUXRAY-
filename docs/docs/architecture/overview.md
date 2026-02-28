---
sidebar_position: 1
title: Architecture Overview
---

# Architecture Overview

MediSage is a **MERN monorepo** with a clear client–server split. The backend exposes a REST + Socket.IO interface; the frontend consumes it through Axios and Socket.IO-client.

---

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌─────────┐  │
│  │ ChatPage │  │ AdminDash │  │ My Orders  │  │My Presc.│  │
│  └────┬─────┘  └─────┬─────┘  └─────┬──────┘  └────┬────┘  │
│       │  Zustand store / Axios API / Socket.IO-client        │
└───────┼──────────────────────────────────────────────────────┘
        │ HTTPS REST         │ WebSocket (Socket.IO)
        ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express / Node ESM)              │
│                                                              │
│  Routes → Controllers → Services → Models                    │
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │             AI Agent Orchestrator            │            │
│  │  Input Guard → Parent Agent → Child Agents  │            │
│  │        → Tools → Output Guard               │            │
│  └───────────────────┬─────────────────────────┘            │
│                       │ OpenAI Agents SDK                    │
│  ┌────────┐  ┌──────┐ │ ┌─────────┐  ┌────────┐  ┌───────┐ │
│  │MongoDB │  │Redis │ │ │Cloudinary│  │Razorpay│  │Resend │ │
│  └────────┘  └──────┘   └─────────┘  └────────┘  └───────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle

### REST Request

```
Client
  → Axios (with Bearer token header)
  → Express Router
  → Rate Limiter (Redis)
  → Auth Middleware (JWT verify)
  → Zod Validation
  → Controller
  → Service / Model
  → JSON Response
```

### Chat Request (Streaming)

```
Client
  → POST /api/chat/stream
  → Controller opens SSE response
  → Agent Orchestrator runs agentic loop
  → Tokens streamed back via res.write()
  → Frontend reads EventSource / fetch stream
```

### Socket.IO Event

```
Admin updates order status
  → PATCH /api/admin/orders/:id
  → Controller emits socket events:
      io.to(`user:<userId>`).emit('order:dispatched', {...})
      io.emit('order:admin-updated', {...})
  → Frontend SocketContext receives event
  → Toast notification + state update
```

---

## Key Design Principles

| Principle | Implementation |
|---|---|
| **Separation of concerns** | Routes → Controllers → Services → Models; no business logic in routes |
| **Stateless REST** | JWT in every request; no server-side session |
| **Real-time via sockets** | All live notifications go through Socket.IO, not polling |
| **Agent isolation** | Each agent has a defined scope; parent orchestrates, children execute |
| **Caching** | Redis caches chat session history to avoid repeated DB reads |
| **Security-first** | Rate limiting, CORS whitelist, HMAC webhook verification, bcrypt, injection guards |

---

## Monorepo Layout

```
HackFusion-2k26-Team-LUXRAY-/
├── backend/
│   ├── src/
│   │   ├── agent/          # AI orchestration (parent, child, guard, tools, prompts)
│   │   ├── config/         # DB, Redis, Cloudinary, OpenAI, Socket.IO
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/      # Auth, multer, validation, rate limiter
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── scheduler/      # node-cron jobs
│   │   ├── services/       # Business logic (cloudinary, email, order, etc.)
│   │   ├── tools/          # Agent tool implementations
│   │   └── utils/          # Logger, helpers
│   ├── package.json        # ESM module
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (chat, admin, auth, layout)
│   │   ├── context/        # SocketContext
│   │   ├── features/       # Feature-scoped components (prescription, voice)
│   │   ├── hooks/          # useChat, useScreenRecorder, useAudioAmplitude
│   │   ├── pages/          # Route-level page components
│   │   ├── services/       # Axios API client, socket wrapper
│   │   ├── store/          # Zustand stores (useAppStore, useAuthStore)
│   │   └── utils/          # Formatters, invoice generator, output parser
│   ├── vite.config.js
│   └── package.json
│
└── docs/                   # Docusaurus documentation
```

---

## Authentication & Role Model

```
Roles: customer | admin | pharmacist

JWT payload: { id, role }
Token stored in: localStorage['pharmacy_token']
Header: Authorization: Bearer <token>

Socket auth: socket.handshake.auth.token
Socket rooms: user:<userId>  (personal notifications)
```

Access control:
- `protect` — verifies JWT, attaches `req.user`
- `restrictTo('admin', 'pharmacist')` — role guard for admin routes
