---
sidebar_position: 10
title: Agent Audit Logs & Traces
---

# Agent Audit Logs & Traces

Every AI agent invocation is fully logged to `AgentAuditLog`. This provides complete traceability, security auditing, and public transparency into how the AI makes decisions.

---

## What Gets Logged

```javascript
{
  userId,           // Who triggered the agent
  sessionId,        // Which chat session
  userMessage,      // Original user input (max 2000 chars)
  agentResponse,    // Final AI response (max 5000 chars)
  agentChain: [],   // Names of agents that ran, e.g. ["ChatParent", "OrderChild"]
  toolsUsed: [],    // Names of tools called, e.g. ["checkStock", "createOrder"]
  durationMs,       // Total wall-clock time (ms)
  status,           // "success" | "error" | "blocked"
  errorMessage,     // If status === "error"
  injectionDetected, // true if input guard flagged an injection attempt
  model,            // "gpt-4o"
  inputTokens,      // OpenAI token usage
  outputTokens,
  traces: [{        // Step-by-step execution trace
    agent: String,  // Agent name
    action: String, // "invoke_tool" | "respond" | "blocked"
    data: Mixed,    // Tool input/output or response content
  }]
}
```

---

## Accessing Traces

### Public Endpoint

```
GET /api/traces
```

No authentication required. Returns recent traces for transparency.

```json
[
  {
    "userId": "...",
    "agentChain": ["ChatParent", "OrderChild"],
    "toolsUsed": ["checkStock", "createOrder"],
    "durationMs": 3200,
    "status": "success",
    "traces": [...]
  }
]
```

### Admin Endpoint

```
GET /api/admin/traces
```

Returns full traces with user details (requires admin auth).

---

## Frontend: Agent Traces Page

Public page at `/traces` (`pages/public/AgentTraces.jsx`):

- Shows recent agent executions
- Displays agent chain (parent → child)
- Lists tools used
- Shows duration and status
- Expandable trace view with step-by-step reasoning
- `TraceSummary` component renders each trace visually

---

## Security: Injection Detection

The **Input Guard** (`agent/guard/input.guard.js`) checks every user message for:
- Prompt injection patterns (e.g., "Ignore previous instructions")
- Jailbreak attempts
- Policy violations (requesting harmful information)

If detected:
- `status: "blocked"` in the audit log
- `injectionDetected: true`
- Agent does **not** run
- User receives a safe refusal response

---

## Performance Monitoring

Using the audit log, you can analyze:

```javascript
// Average agent response time
db.agentauditlogs.aggregate([
  { $group: { _id: null, avgDuration: { $avg: "$durationMs" } } }
])

// Most used tools
db.agentauditlogs.aggregate([
  { $unwind: "$toolsUsed" },
  { $group: { _id: "$toolsUsed", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Blocked/errored requests
db.agentauditlogs.find({ status: { $ne: "success" } })

// Token usage per user
db.agentauditlogs.aggregate([
  { $group: { _id: "$userId", totalTokens: { $sum: { $add: ["$inputTokens", "$outputTokens"] } } } }
])
```

---

## Agent Logger Utility

`utils/agentLogger.js` provides structured logging during agent execution:

```javascript
agentLogger.info('Agent started', { agentName, userId, sessionId });
agentLogger.tool('Tool called', { tool: 'checkStock', input });
agentLogger.tool('Tool result', { tool: 'checkStock', output });
agentLogger.info('Agent completed', { durationMs, tokensUsed });
```

Logs appear in server console and are captured in traces.
