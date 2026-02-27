
# 📦 Redis Deep Testing & Validation Prompt

AI Pharmacy Platform – Comprehensive Verification

---

## 🎯 Objective

Perform **detailed end-to-end testing** of Redis integration to ensure:

* All cache layers function correctly
* TTL behavior works properly
* No logic layer interference
* Medical safety constraints are preserved
* Graceful failure handling works
* Performance improvements are measurable

Redis must behave strictly as a **performance + cache layer**, not as a business logic or data source.

---

# 🧪 Phase 1 — Connection & Stability Testing

### ✅ Test 1: Redis Connection

* Verify Redis connects successfully at startup.
* Confirm logs show:

  ```
  Redis Connected
  ```
* Validate no application crash if Redis is unavailable.

### ✅ Test 2: Graceful Failure

Simulate Redis failure:

* Stop Redis locally.
* Restart server.
* Ensure:

  * App still works
  * Agent runs normally
  * Translation still works
  * TTS still works
  * Only caching is skipped

Expected behavior:

```
Redis unavailable. Running without cache.
```

System must degrade gracefully.

---

# 🧪 Phase 2 — Translation Cache Testing

### 🔍 Scenario A: First Translation

1. Send non-English message.
2. Confirm:

   * Redis GET → miss
   * Translation API called
   * Redis SET executed
   * TTL = 3600 seconds

Check logs:

```
operation: GET
hit: false
```

```
operation: SET
```

---

### 🔍 Scenario B: Repeated Translation

Send same message again.

Expected:

* Redis GET → hit
* Translation API NOT called
* Latency significantly lower

Verify TTL countdown via:

```bash
redis-cli TTL translation:{key}
```

Must return value < 3600

---

### 🔒 Medical Safety Verification

Ensure:

* mg/ml/strip values preserved
* Numeric quantities unchanged
* Medicine names unchanged
* JSON never cached

---

# 🧪 Phase 3 — Session Memory Testing

### 🔍 Scenario A: Message Append

1. Send user message.
2. Verify:

   * RPUSH session:{userId}
   * TTL = 1800 seconds

Check via:

```bash
redis-cli LRANGE session:{userId} 0 -1
```

Confirm correct role + content structure.

---

### 🔍 Scenario B: Expiry Test

1. Manually set TTL to 5 seconds.
2. Wait.
3. Confirm:

   ```
   redis-cli EXISTS session:{userId}
   ```

   Returns 0.

Session must auto-clean.

---

# 🧪 Phase 4 — TTS Cache Testing

### 🔍 First Request

* Redis GET → miss
* TTS generated
* Redis SET
* TTL = 86400

### 🔍 Second Request

* Redis GET → hit
* TTS NOT regenerated
* Audio returned instantly

Verify TTL:

```bash
redis-cli TTL tts:{key}
```

Must be <= 86400

---

# 🧪 Phase 5 — Rate Limiting Test

### 🔍 Normal Use

Send <20 requests in 60 seconds.

Expected:

* INCR increments
* No block

---

### 🔍 Abuse Simulation

Send >20 requests in 60 seconds.

Expected:

* HTTP 429 returned
* Agent NOT executed
* Counter resets after 60 seconds

Check:

```bash
redis-cli GET rate:{userId}
```

Confirm expiry:

```bash
redis-cli TTL rate:{userId}
```

---

# 🧪 Phase 6 — Performance Benchmark

Measure latency:

### Without Redis

* Disable Redis
* Measure translation + TTS response time

### With Redis

* Enable Redis
* Repeat same request

Expected:

* Translation latency reduced
* TTS latency near-zero on repeat
* Session access faster

Document:

* Average latency
* Cache hit ratio

---

# 🧪 Phase 7 — Safety Boundary Testing

Ensure Redis NEVER:

* Stores prescription images
* Stores payment data
* Stores permanent medical records
* Alters dosage values
* Alters numeric quantities

Verify keys:

```bash
redis-cli KEYS *
```

Confirm only:

* translation:*
* session:*
* tts:*
* rate:*

---

# 📊 Observability Verification

Every operation must log:

```json
{
  "operation": "GET | SET | INCR | RPUSH",
  "key": "",
  "hit": true/false,
  "latencyMs": "",
  "userId": ""
}
```

Validate:

* All Redis operations logged
* No missing traces
* Translation tracing intact

---

# 🏁 Final Acceptance Criteria

System is production-ready ONLY if:

✅ No crash when Redis unavailable
✅ All TTLs working
✅ Cache hit reduces API usage
✅ No medical data persistence in Redis
✅ Agent logic untouched
✅ Business logic untouched
✅ Deterministic behavior preserved

---

# 🚫 Strict Validation Rules

Reject implementation if:

* Redis modifies business logic
* Redis becomes primary storage
* TTL missing on any key
* Hardcoded Redis URL exists
* Sensitive data stored
* Agent prompts modified

---

# 🎯 Final Verification Output

Produce final report:

```
Redis Integration Status:
Connection: PASS/FAIL
Translation Cache: PASS/FAIL
Session Memory: PASS/FAIL
TTS Cache: PASS/FAIL
Rate Limiting: PASS/FAIL
Medical Safety: PASS/FAIL
Graceful Degradation: PASS/FAIL
Production Ready: YES/NO
```

---


