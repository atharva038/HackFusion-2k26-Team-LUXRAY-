---
sidebar_position: 5
title: Real-Time Notifications
---

# Real-Time Notifications

All live updates use **Socket.IO**. The backend emits targeted events to specific users or broadcasts to all admins.

---

## Connection Setup

### Backend (`config/socket.js`)

```javascript
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT
  socket.userId = decoded.id;
  socket.role   = decoded.role;
  socket.username = user.name;
  next();
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);  // Personal room
  socket.emit('connection:success', { userId, username, role });
});
```

### Frontend (`context/SocketContext.jsx`)

```javascript
const socket = io(BACKEND_URL, {
  auth: { token: localStorage.getItem('pharmacy_token') }
});
```

Listeners are registered inside a `useEffect` on mount. Events dispatch to Zustand store and show `react-hot-toast` notifications.

---

## Complete Event Reference

### Order Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `order:status-updated` | Server → Client | `user:<id>` | `{ orderId, status, rejectionReason, approvedBy, totalAmount }` |
| `order:dispatched` | Server → Client | `user:<id>` | `{ orderId, message }` |
| `order:rejected` | Server → Client | `user:<id>` | `{ orderId, reason }` |
| `order:admin-updated` | Server → all | broadcast | `{ orderId, status, userName, ... }` |

### Prescription Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `prescription:updated` | Server → Client | `user:<id>` | `{ status, medicine, data }` |
| `prescription:admin-updated` | Server → all | broadcast | `{ userName, medicine, data }` |

### Inventory Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `inventory:medicine-updated` | Server → all | broadcast | `{ medicine }` |
| `inventory:medicine-restocked` | Server → all | broadcast | `{ medicine: {name, previousStock, newStock, quantityAdded} }` |
| `inventory:low-stock-alert` | Server → all | broadcast | `{ medicine: {name, stock}, data }` |
| `inventory:low-stock-manual-alert` | Server → all | broadcast | `{ alertedCount, data }` |

### Refill Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `refill:alert-updated` | Server → all | broadcast | `{ medicine, status, data }` |

### Room / Chat Events

| Event | Direction | Description |
|---|---|---|
| `join:room` (client → server) | Client emits | Join a specific room |
| `leave:room` (client → server) | Client emits | Leave a room |
| `message:send` (client → server) | Client emits | Send a message |
| `message:received` (server → client) | Server emits | Receive a message |
| `user:joined` | Server → room | User joined notification |
| `user:left` | Server → room | User left notification |
| `user:typing` | Server → room | Typing indicator |
| `user:stopped-typing` | Server → room | Stopped typing |
| `user:disconnected` | Server → room | User disconnected |

### Health Check

| Event | Description |
|---|---|
| `ping` (client → server) | Client health check |
| `pong` (server → client) | `{ timestamp }` response |

---

## Frontend Notification State

Notifications are stored in Zustand:

```javascript
// useAppStore
notifications: [
  {
    id: uuid,
    type: 'order' | 'prescription' | 'inventory' | 'refill',
    title: String,
    message: String,
    timestamp: Date,
    read: Boolean,
    data: { orderId, ... }
  }
]
unreadCount: Number
```

The `Header` component shows the unread badge. Clicking a notification marks it as read.

---

## Rooms

| Room | Members | Purpose |
|---|---|---|
| `user:<userId>` | Single user | Personal order/prescription updates |
| (broadcast) | All connected clients | Admin and inventory events |

---

## Error Handling

```javascript
// Server
socket.emit('error:response', { message, code });

// Client
socket.on('error:response', ({ message }) => {
  toast.error(message);
});
```
