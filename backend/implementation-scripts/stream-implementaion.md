
# 🚀 STREAMING ARCHITECTURE IMPLEMENTATION PROMPT

AI Pharmacy Platform (Full Stack + Agents + Voice)

---

## 🎯 Objective

Implement real-time streaming responses across the entire AI Pharmacy system including:

* Multilingual wrapper
* Core agent
* Redis cache layer
* Voice STT → Agent → TTS pipeline
* HTTP streaming to frontend
* Graceful fallback if streaming fails

WITHOUT modifying:

* Agent prompts
* Tool execution logic
* Business logic
* Safety validation
* Prescription workflow
* Payment flow

Streaming must be a transport-level improvement only.

---

# 🏗 Current Architecture

```
Frontend (Chat / Voice)
      ↓
Multilingual Wrapper
      ↓
Redis (Session + Cache)
      ↓
Core Agent (English Native)
      ↓
MongoDB
```

New streaming must support:

* Text streaming
* Voice streaming
* Final deterministic output
* Proper completion flag

---

# 🧠 Streaming Requirements

### Must Support:

* Async generator pattern
* Chunk-based streaming
* Final output emission
* isCompleted flag
* Works with Redis session memory
* Works with translation layer
* Works with TTS

### Must NOT:

* Stream tool raw JSON
* Stream unsafe partial dosage
* Break prescription validation
* Alter numeric values mid-stream

---

# 🔧 Backend Streaming Implementation

## 1️⃣ Agent Streaming Wrapper

Create:

```
/services/streamService.js
```

Implementation:

```js
import { run } from "@openai/agents";
import agent from "../agents/coreAgent.js";

export async function* streamAgentResponse(query, userId) {
  const result = await run(agent, query, { stream: true });

  const stream = result.toTextStream();

  let finalText = "";

  for await (const chunk of stream) {
    finalText += chunk;

    yield {
      isCompleted: false,
      value: chunk
    };
  }

  yield {
    isCompleted: true,
    value: result.finalOutput
  };

  return finalText;
}
```

---

# 2️⃣ Express Streaming Route

```
/routes/chat.js
```

```js
router.post("/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { message, userId } = req.body;

  try {
    const stream = streamAgentResponse(message, userId);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  } catch (err) {
    console.error("Streaming error:", err);
    res.end();
  }
});
```

---

# 3️⃣ Redis Session Integration (Streaming Compatible)

When streaming starts:

* Load session from Redis
* Append user message
* Append final assistant message ONLY after completion

Never store partial chunks.

Example:

```js
await redis.rPush(`session:${userId}`, JSON.stringify({
  role: "assistant",
  content: finalText
}));

await redis.expire(`session:${userId}`, 1800);
```

---

# 🌍 Multilingual Streaming Handling

Streaming flow must be:

```
User (Hindi)
   ↓
Translate to English (non-streamed)
   ↓
Agent streams English response
   ↓
Collect full English finalOutput
   ↓
Translate final output to Hindi
   ↓
Stream translated chunks to frontend
```

Important:

* Never stream partially translated text
* Translation happens only after full agent output
* Only final response is translated

---

# 🎙 Voice Streaming Architecture

Voice flow:

```
User Speech
   ↓
STT (non-streamed)
   ↓
Agent Streaming
   ↓
Collect finalOutput
   ↓
Generate TTS
   ↓
Stream audio URL or chunks
```

Never stream TTS before full text is ready.

---

# ⚡ Performance Safeguards

* Do NOT store streaming chunks in Redis
* Only store final message
* Skip Redis if English + no session
* Fail gracefully if Redis down
* Fail gracefully if streaming fails → fallback to normal response

---

# 🛡 Medical Safety Guard

Before yielding finalOutput:

Validate:

* No dosage mutation
* No numeric corruption
* No tool JSON leakage
* No prescription data exposure

If validation fails:

Return fallback safe message.

---

# 🧪 Testing Requirements

Test scenarios:

1. Long medical explanation
2. Prescription-required medicine
3. Tool-calling response
4. Multilingual response
5. Voice flow
6. Redis offline
7. Streaming interrupted

Expected:

* No crash
* Deterministic final output
* Proper completion flag
* No duplicated messages

---

# 📡 Frontend Streaming Handling

Frontend must:

* Append chunks to message UI
* Replace final chunk if isCompleted true
* Stop loader
* Prevent duplicate final message

---

# 🏁 Final Expected Behavior

Streaming must:

* Feel instant
* Not break safety
* Not alter logic
* Not increase hallucination
* Not duplicate messages
* Not corrupt dosage values
* Not leak tool raw output

---

# 🚫 Strict Prohibitions

Do NOT:

* Modify agent system prompt
* Modify tool schema
* Store chunks in Redis
* Stream tool JSON
* Translate partial chunks
* Hardcode anything

---

# 🎯 Acceptance Criteria

System passes if:

✅ Streaming works for text
✅ Streaming works with voice
✅ Redis session intact
✅ Multilingual safe
✅ No agent modification
✅ No tool corruption
✅ No performance regression
✅ No memory leak
✅ Deterministic final output

---

# 🧠 Builder Advice For You

Your previous issue (took too much time + errors) likely because:

* Streaming + translation mixed together
* Session writes happening per chunk
* TTS triggered per chunk
* No finalOutput control

Keep streaming purely presentation-layer.

Business logic stays synchronous.

---

