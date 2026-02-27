# 📦 Redis Integration Architecture Prompt

**AI Pharmacy Platform**

---

# 🎯 Objective

Integrate Redis into the existing AI Pharmacy platform to:

* Improve performance
* Reduce translation & TTS costs
* Enable fast session-based conversation memory
* Add rate limiting
* Maintain medical safety

WITHOUT modifying:

* Core Agent logic
* Tool architecture
* Service layer
* Business logic

Redis must function as a **performance + cache layer only**, not a logic layer.

---

# 🏗 Architecture Context

Current system:

```text
Frontend
   ↓
Multilingual Wrapper Layer
   ↓
Core Agent (English-native)
   ↓
MongoDB
```

Updated architecture:

```text
Frontend
   ↓
Multilingual Wrapper
   ↓
Redis (Cache + Session Layer)
   ↓
Core Agent
   ↓
MongoDB (Persistent Storage)
```

Redis must sit between the wrapper and the agent/database.

---

# 🧠 Design Principles

1. Redis is **stateless cache**, not source of truth.
2. MongoDB remains primary persistent storage.
3. Redis TTL must be used for all temporary data.
4. Never store sensitive medical data permanently in Redis.
5. Agent remains completely untouched.
6. Translation safety rules must remain intact.

---

# 🛠 Required Redis Use Cases

Implement the following:

---

## 1️⃣ Translation Cache

### Purpose

Avoid repeated translation API calls for identical text.

### Key Format

```text
translation:{sourceLang}:{hash(originalText)}
```

### Behavior

Before translation:

* Check Redis
* If found → return cached translation
* If not found → call translation API
* Store in Redis with TTL = 1 hour

### TTL

```text
3600 seconds
```

### Constraints

* Preserve medicine names
* Preserve dosage units (mg, ml, strips)
* Preserve numeric values
* Do not translate JSON

---

## 2️⃣ Conversation Session Memory

### Purpose

Store temporary chat history for agent context without hitting database.

### Key Format

```text
session:{userId}
```

### Data Structure

Use Redis List:

```json
[
  { "role": "user", "content": "..." },
  { "role": "assistant", "content": "..." }
]
```

### Behavior

On new message:

* Append message using RPUSH
* Set TTL = 30 minutes
* When user inactive → auto-expire

### Constraints

* Do not permanently store medical records
* Redis memory must auto-clean

---

## 3️⃣ TTS Audio Cache

### Purpose

Avoid regenerating same audio repeatedly.

### Key Format

```text
tts:{language}:{hash(responseText)}
```

### Behavior

Before TTS generation:

* Check Redis
* If found → return cached audio
* If not → generate TTS
* Store with TTL = 24 hours

### TTL

```text
86400 seconds
```

---

## 4️⃣ Rate Limiting

### Purpose

Prevent spam or abuse.

### Key Format

```text
rate:{userId}
```

### Behavior

* Increment counter
* Set expiry = 60 seconds
* Limit: 20 requests per minute

If exceeded:
Return HTTP 429

---

# 🔧 Technical Implementation Requirements

## Environment Variables

Add:

```env
REDIS_URL=redis://localhost:6379
```

Must support:

* Local Redis
* Redis Cloud
* Upstash

---

## Redis Client Configuration

Create:

```
config/redis.js
```

Must:

* Use official Node Redis client
* Auto-connect
* Handle errors gracefully
* Not crash application if Redis unavailable
* Fail gracefully and continue without cache

---

# ⚡ Performance Rules

1. Skip Redis entirely if language = English and no session required
2. Do not store structured JSON tool responses
3. Only cache:

   * Translation text
   * Final response text
   * TTS audio
   * Chat session messages
4. All keys must include TTL
5. No permanent storage in Redis

---

# 🔐 Medical Safety Constraints

Redis must NEVER:

* Alter dosage values
* Alter numeric quantities
* Alter mg/ml/strips
* Alter prescription details
* Store payment data
* Store prescription images

Redis is cache only.

---

# 📊 Observability

Each Redis operation must log:

```json
{
  "operation": "GET | SET | INCR | RPUSH",
  "key": "",
  "hit": true/false,
  "latencyMs": "",
  "userId": ""
}
```

Translation tracing must remain intact.

---

# 🧪 Failure Handling Rules

If Redis fails:

* Log error
* Continue system without cache
* Do not block agent execution
* Do not crash server

System must degrade gracefully.

---

# 📁 Suggested Folder Structure

```
/config
   redis.js

/services
   translationService.js
   sessionService.js
   ttsService.js
   rateLimitService.js

/middleware
   rateLimiter.js
```

Redis logic must stay inside services layer, not inside agent.

---

# 🏆 Expected Result

After implementation:

* Translation calls reduced significantly
* TTS cost reduced
* Conversation memory faster
* System more scalable
* No change to agent logic
* Medical safety preserved
* System production-ready

---

# 🚫 Strict Prohibitions

Do NOT:

* Modify agent prompts
* Modify tool execution
* Store persistent order data in Redis
* Use Redis as primary database
* Hardcode Redis URL

---

# 🎯 Final Goal

Redis must act as:

> High-speed performance layer that enhances multilingual AI pharmacy system without altering core intelligence.

The system must remain:

* Deterministic
* Safe
* Scalable
* Medically reliable
* Architecturally clean

---

**End of Redis Integration Specification**

---