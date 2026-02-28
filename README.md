# 🧠 Agentic AI Pharmacy System

An AI-powered autonomous pharmacy assistant built with the MERN stack + OpenAI Agent SDK.

## 📁 Folder Structure

```
Hackfusion-2k26/
│
├── frontend/                          # React + Vite App
│   ├── src/
│   │   ├── features/
│   │   │   ├── chat/                  # Chat UI (ChatWindow, ChatBubble, MessageInput, ToolStatus)
│   │   │   ├── admin/                 # Admin Dashboard (AdminPanel, InventoryTable, OrdersTable, RefillAlerts, TraceSummary)
│   │   │   └── voice/                 # Voice Input (VoiceButton)
│   │   ├── services/                  # API service layer (centralized backend calls)
│   │   ├── hooks/                     # Custom React hooks (useChat, useDarkMode)
│   │   ├── utils/                     # Frontend helpers (formatters)
│   │   ├── pages/                     # Page-level components (future)
│   │   ├── App.jsx                    # Root layout + dark mode toggle
│   │   └── index.css                  # Tailwind config + beige/dark theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                           # Express API Server
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                  # MongoDB connection
│   │   │   └── openai.js              # OpenAI client singleton
│   │   ├── routes/
│   │   │   ├── chat.routes.js         # POST /api/chat, GET /api/chat/history
│   │   │   ├── admin.routes.js        # CRUD for inventory, orders, refills, traces
│   │   │   └── webhook.routes.js      # External integration webhooks
│   │   ├── controllers/
│   │   │   ├── chat.controller.js     # Delegates to AI orchestrator
│   │   │   └── admin.controller.js    # Dashboard data endpoints
│   │   ├── agents/
│   │   │   ├── orchestrator.agent.js  # Agentic loop — iterative tool calling with OpenAI
│   │   │   └── prompts.js             # System prompt + tool definitions
│   │   ├── tools/
│   │   │   ├── inventory.tool.js      # Check pharmacy stock
│   │   │   ├── prescription.tool.js   # Validate prescription requirements
│   │   │   ├── order.tool.js          # Create orders + decrement stock
│   │   │   ├── warehouse.tool.js      # External warehouse availability
│   │   │   └── refill.tool.js         # Refill eligibility check
│   │   ├── services/
│   │   │   ├── inventory.service.js   # Inventory business logic
│   │   │   └── order.service.js       # Order business logic
│   │   ├── models/
│   │   │   ├── medicine.model.js      # Medicine schema (name, dosage, stock, Rx flag)
│   │   │   ├── order.model.js         # Order schema (patient, medicine, status)
│   │   │   ├── user.model.js          # User schema (name, email, role)
│   │   │   └── refill.model.js        # Refill schema (patient, medicine, daysLeft)
│   │   ├── scheduler/
│   │   │   └── refill.scheduler.js    # Cron job: daily refill countdown
│   │   ├── utils/
│   │   │   ├── logger.js              # Structured console logger
│   │   │   └── helpers.js             # asyncHandler, ID generator
│   │   └── app.js                     # Express entry point
│   ├── .env                           # Environment variables
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
# Configure .env with your MongoDB URI and OpenAI API key
npm run dev
```

