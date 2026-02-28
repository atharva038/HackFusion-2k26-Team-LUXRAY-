---
sidebar_position: 3
title: Frontend Architecture
---

# Frontend Architecture

The frontend is a **React 19** SPA built with Vite. State management uses Zustand; real-time communication uses Socket.IO-client; HTTP calls go through a centralized Axios instance.

---

## Directory Structure

```
frontend/src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── chat/
│   │   └── ChatPage.jsx            # Main AI chat interface
│   ├── user/
│   │   ├── MyOrders.jsx            # Order history + live status
│   │   └── MyPrescriptions.jsx     # Prescription list + session video
│   └── admin/
│       ├── AdminLayout.jsx
│       ├── Overview.jsx            # Dashboard stats
│       ├── Orders.jsx
│       ├── Inventory.jsx
│       ├── Prescriptions.jsx
│       ├── PrescriptionReview.jsx
│       ├── Alerts.jsx              # Refill alerts
│       ├── Logs.jsx                # Inventory audit logs
│       └── PharmacistAgent.jsx     # Pharmacist-only AI interface
│
├── components/
│   ├── chat/                       # ChatArea, InputArea, MessageBubble, etc.
│   ├── admin/                      # Admin-specific tables and panels
│   ├── auth/                       # ProtectedRoute HOC
│   ├── layout/                     # Header
│   ├── avatar/                     # AiAvatar (lip-sync animation)
│   └── ui/                         # Modals (ActionModal, AllergySetup, etc.)
│
├── features/
│   ├── chat/                       # ChatWindow, ChatBubble, MessageInput
│   ├── admin/                      # Admin feature components
│   ├── prescription/               # PrescriptionUpload, PrescriptionCard, camera
│   └── voice/                      # VoiceButton
│
├── context/
│   └── SocketContext.jsx           # Socket.IO connection + all event listeners
│
├── hooks/
│   ├── useChat.js                  # Chat send / session management
│   ├── useDarkMode.js
│   ├── useAudioAmplitude.js        # Audio visualization for avatar
│   └── useScreenRecorder.js        # MediaRecorder screen capture
│
├── services/
│   ├── api.js                      # Axios instance with interceptors
│   └── socket.js                   # Socket.IO singleton wrapper
│
├── store/
│   ├── useAppStore.js              # Messages, sessions, theme, language, notifications
│   └── useAuthStore.js             # User, token, login/logout
│
└── utils/
    ├── formatters.js
    ├── generateInvoice.js          # jsPDF invoice generation
    └── parseStructuredOutput.js    # Parse AI JSON responses
```

---

## State Management (Zustand)

### `useAuthStore`

```javascript
{
  user: null,          // User object from /api/auth/me
  token: string,       // JWT from localStorage
  isAuthenticated: bool,
  login(token, user),
  logout(),
}
```

### `useAppStore`

```javascript
{
  // Chat
  messages: [],           // Current session messages
  sessions: [],           // All user sessions
  activeSessionId: null,
  selectedLanguage: 'en', // Persisted to localStorage

  // Notifications
  notifications: [],      // From socket events
  unreadCount: 0,

  // Theme
  isDarkMode: bool,

  // Actions
  addMessage(msg),
  setMessages(msgs),
  setSessions(sessions),
  addNotification(notif),
  clearNotifications(),
  toggleDarkMode(),
  setLanguage(lang),
}
```

---

## API Service (`services/api.js`)

Centralized Axios instance with:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Request interceptor → attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharmacy_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor → handle 401 (logout)
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) useAuthStore.getState().logout();
  return Promise.reject(error);
});
```

---

## Socket Context (`context/SocketContext.jsx`)

Wraps the entire app. Connects on login, disconnects on logout.

Listeners registered:
- `order:status-updated` → notification + toast
- `order:dispatched` → triggers `useScreenRecorder.stopRecording()` + upload
- `order:rejected` → notification
- `inventory:low-stock-alert` → admin toast
- `inventory:medicine-restocked` → admin notification
- `prescription:updated` → notification
- `refill:alert-updated` → notification
- `connection:success` → connected toast
- `disconnect` → disconnected toast

---

## Routing

```
/                 → Redirect to /chat or /login
/login            → LoginPage
/register         → RegisterPage
/chat             → ChatPage (protected)
/orders           → MyOrders (protected)
/prescriptions    → MyPrescriptions (protected)
/admin/*          → AdminLayout (protected, admin/pharmacist only)
  /admin          → Overview
  /admin/orders   → Orders
  /admin/inventory→ Inventory
  /admin/prescriptions → Prescriptions
  /admin/alerts   → Alerts
  /admin/logs     → Logs
  /admin/agent    → PharmacistAgent
```

---

## Key Hooks

### `useScreenRecorder`

```javascript
const { startRecording, stopRecording, uploadSessionRecording } = useScreenRecorder();

// startRecording() — requests getDisplayMedia() + getUserMedia()
// stopRecording()  — stops MediaRecorder, returns Blob
// uploadSessionRecording(blob, orderId) — POST to /api/recording/upload
```

Used in `ChatPage`: starts on mount, stops on `order:dispatched` socket event.

### `useChat`

Handles:
- Sending messages (sync or SSE streaming)
- Creating / switching sessions
- Loading session history from API

### `useAudioAmplitude`

Reads Web Audio API `AnalyserNode` to drive the AI avatar's lip-sync animation based on real-time TTS audio amplitude.
