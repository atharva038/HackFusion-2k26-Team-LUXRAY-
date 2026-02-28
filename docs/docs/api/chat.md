---
sidebar_position: 2
title: Chat API
---

# Chat API

Base path: `/api/chat`

All endpoints require authentication. Rate limit: **20 requests/user/minute**.

---

## `POST /api/chat`

Send a message and receive a full synchronous response.

### Request

```json
{
  "message": "Do you have Paracetamol 500mg?",
  "sessionId": "64f...",   // optional — omit to create a new session
  "language": "en"          // "en" | "hi" | "mr"
}
```

### Response `200`

```json
{
  "success": true,
  "response": "Yes, we have Paracetamol 500mg in stock at ₹12 per strip...",
  "sessionId": "64f...",
  "toolsUsed": ["checkStock"],
  "agentChain": ["ChatParent", "ReceptionistChild"]
}
```

### Errors

| Status | Error |
|---|---|
| `400` | Missing message |
| `401` | Unauthorized |
| `429` | Rate limit exceeded |
| `500` | Agent execution error |

---

## `POST /api/chat/stream`

Send a message and receive a streaming SSE response.

### Request

Same body as `POST /api/chat`.

### Response `200` — SSE stream

```
Content-Type: text/event-stream

data: {"type":"token","content":"Yes, "}
data: {"type":"token","content":"we have Paracetamol..."}
data: {"type":"tool","name":"checkStock","status":"called"}
data: {"type":"tool","name":"checkStock","status":"done","result":{...}}
data: {"type":"done","sessionId":"64f...","toolsUsed":["checkStock"]}
```

### Frontend Usage

```javascript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ message, sessionId, language }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const lines = decoder.decode(value).split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));
      if (event.type === 'token') appendToken(event.content);
    }
  }
}
```

---

## `GET /api/chat/sessions`

Get all chat sessions for the authenticated user.

### Response `200`

```json
{
  "success": true,
  "sessions": [
    {
      "_id": "64f...",
      "title": "Paracetamol inquiry",
      "agentType": "customer",
      "createdAt": "2026-02-28T10:00:00Z",
      "updatedAt": "2026-02-28T10:05:00Z"
    }
  ]
}
```

---

## `GET /api/chat/history/:sessionId`

Get the full message history for a session.

### Response `200`

```json
{
  "success": true,
  "session": {
    "_id": "64f...",
    "title": "Paracetamol inquiry",
    "messages": [
      { "role": "user", "content": "Do you have Paracetamol?" },
      { "role": "ai", "content": "Yes, we have Paracetamol 500mg..." }
    ]
  }
}
```

---

## `DELETE /api/chat/sessions/:sessionId`

Delete a chat session and its history.

### Response `200`

```json
{ "success": true, "message": "Session deleted" }
```
