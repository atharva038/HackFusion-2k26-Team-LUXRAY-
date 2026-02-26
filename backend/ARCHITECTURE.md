# Agentic Pharmacy Backend — Architecture, Analysis & Integration Plan

> Written by: Senior Architecture Review
> Scope: Full backend source (`src/`)
> Codebase: Node.js / Express / Mongoose / `@openai/agents` SDK

---

## Table of Contents

1. [Overall Architecture](#1-overall-architecture)
2. [Agent Inventory](#2-agent-inventory)
3. [Tool Inventory](#3-tool-inventory)
4. [Execution Flows](#4-execution-flows)
5. [Environment Variables](#5-environment-variables)
6. [Database Models](#6-database-models)
7. [Critical Bugs & Issues](#7-critical-bugs--issues)
8. [Integration Plan](#8-integration-plan)

---

## 1. Overall Architecture

The backend is a Node.js/Express application that acts as both a REST API server and an **agentic AI platform**. There are **two completely separate agent systems** living in the same codebase — one is used, one is dead.

```
frontend (React/Vite)
        │
        ▼
Express Server (src/app.js)
        │
   ┌────┴────────────────────────────────────┐
   │                Route Layer              │
   │  /api/auth  /api/chat  /api/admin       │
   │  /api/prescription  /api/tts            │
   └────┬────────────────────────────────────┘
        │
   ┌────┴──────────────────────────────────────────────────────┐
   │                    TWO AGENT SYSTEMS                      │
   │                                                           │
   │  SYSTEM A: @openai/agents SDK (ACTIVE)                   │
   │  ┌──────────────────────────────────────────────────┐    │
   │  │  parentChat.agent (Parent/Router)                │    │
   │  │    ├── receptionist.chat.child (Advisor)         │    │
   │  │    │       tools: checkStock, searchMed, describe│    │
   │  │    └── order.chat.child (Order Taker)            │    │
   │  │            tools: order_medicine                 │    │
   │  └──────────────────────────────────────────────────┘    │
   │                                                           │
   │  ┌──────────────────────────────────────────────────┐    │
   │  │  imgAgent (Prescription OCR)                     │    │
   │  │    tools: extract_text_from_url (Mistral OCR)    │    │
   │  │                                                  │    │
   │  │  medicationNotifyAgent (Reminder Scheduler)      │    │
   │  │    tools: get_active_prescriptions, send_email   │    │
   │  └──────────────────────────────────────────────────┘    │
   │                                                           │
   │  SYSTEM B: Raw OpenAI SDK (DEAD — NEVER CALLED)          │
   │  ┌──────────────────────────────────────────────────┐    │
   │  │  orchestrator.agent.js                           │    │
   │  │    tools: check_inventory, validate_prescription │    │
   │  │           create_order, check_warehouse, refill  │    │
   │  └──────────────────────────────────────────────────┘    │
   └───────────────────────────────────────────────────────────┘
        │
   ┌────┴──────────────┐
   │  External Services│
   │  MongoDB Atlas    │
   │  OpenAI API       │
   │  Mistral OCR API  │
   │  Cloudinary CDN   │
   │  Gmail (SMTP)     │
   └───────────────────┘
```

### SDK Used: `@openai/agents`

The active system uses `@openai/agents` (OpenAI Agents SDK), which provides:
- `Agent` class for defining agents with instructions and tools
- `tool()` helper with Zod schema validation
- `run()` to execute agents
- Built-in handoff mechanism between agents

---

## 2. Agent Inventory

### 2.1 Parent Chat Agent
**File:** `src/agent/parent/parentChat.agent.js`
**SDK:** `@openai/agents`
**Role:** Entry point router. Receives raw user messages and routes to the correct child agent via handoffs.

| Property | Value |
|----------|-------|
| Name | `Parent_Agent` |
| Handoffs | `medicine_advisor_stock_reader`, `order_maker` |
| Tools | None (routes only) |
| Input | Free-text user message |
| Output | Final output from whichever child agent handled the request |

**Routing Logic:**
- Symptoms / search / availability / describe → `receptionist.chat.child`
- Buy / order / purchase / refill → `order.chat.child`

**Entry Function:** `chatPharma(q)` — called by `chat.controller.js`

---

### 2.2 Receptionist Child Agent (medicine_advisor_stock_reader)
**File:** `src/agent/child/chat/receptionist.chat.child.agent.js`
**Role:** Medicine advisor. Searches medicine by symptom, checks stock, describes medicines.

| Property | Value |
|----------|-------|
| Name | `medicine_advisor_stock_reader` |
| Tools | `checkStock`, `searchMedByDescription`, `describeMed` |
| Input | User query about symptoms, medicines, availability |
| Output | Formatted recommendation with name, purpose, description, price, stock |

---

### 2.3 Order Child Agent (order_maker)
**File:** `src/agent/child/chat/order.chat.child.agent.js`
**Role:** Collects patient details and places a medicine order.

| Property | Value |
|----------|-------|
| Name | `order_maker` |
| Tools | `order` (order_medicine) |
| Input | Patient ID, age, gender, medicine name/ID, quantity, dosage, prescription flag |
| Output | Order confirmation with medicine name, quantity, total price, remaining stock |

**Collects missing info conversationally before calling the tool.**

---

### 2.4 Image Data Extractor Agent (imgAgent)
**File:** `src/agent/child/notify/img_data_extractor.notify.child.js`
**Role:** OCR pipeline. Takes a Cloudinary URL, extracts prescription data via Mistral OCR.

| Property | Value |
|----------|-------|
| Name | `image_data_extraction` |
| Tools | `ocrTool` (extract_text_from_url) |
| Input | Cloudinary secure URL (string) |
| Output | Structured JSON: `{ isPrescription, rejection_reason?, medicines[] }` |
| Output Schema | Zod-validated via `PrescriptionSchema` |

**The Zod `outputType` enforces typed output** — if the AI doesn't return valid JSON matching the schema, it retries automatically.

---

### 2.5 Medication Notifier Agent (medicationNotifyAgent)
**File:** `src/agent/child/notify/medication.notify.child.js`
**Role:** Checks active prescriptions and sends email reminders at the right time windows.

| Property | Value |
|----------|-------|
| Name | `medication_notifier` |
| Tools | `fetchDosesTool`, `sendEmailTool` |
| Input | Current time string in `HH:mm` format |
| Output | No structured output — side effect is email sent |

**Time Windows:**
- Morning: 08:00–10:00
- Afternoon: 13:00–14:00
- Evening: 18:00–20:00
- Bedtime: 21:00–23:00

**Triggered by:** `notification.schedule.js` cron job (currently hardcoded to 08:30 daily).

---

### 2.6 Orchestrator Agent (DEAD — NOT IN USE)
**File:** `src/agent/orchestrator.agent.js`
**SDK:** Raw `openai` npm package (not `@openai/agents`)
**Status:** Imported in `chat.controller.js` but **never called**. `chatPharma` (parentChat) is called instead.

This was the original system with manual agentic loop. The 5 tools in `src/tools/` (inventory, order, prescription, warehouse, refill) are **only wired to this dead orchestrator**. They are never invoked in the current active chat flow.

---

## 3. Tool Inventory

### Active Tools (used by @openai/agents system)

| Tool Name | File | Agent | DB Operation |
|-----------|------|-------|--------------|
| `check_medicine_details` | `checkStock.chat.tools.agent.js` | Receptionist | `Medicine.find()` (all!), `Medicine.findOne()` |
| `search_medicine_by_need` | `searchMedByDescription.chat.tools.agent.js` | Receptionist | `Medicine.find({stock:{$gt:0}})` then inner AI agent |
| `describe_medicine` | `describe.chat.tools.agent.js` | Receptionist | `Medicine.findOne()` |
| `order_medicine` | `order.chat.tools.agent.js` | Order Child | `Medicine.findOne()`, `reduceQuantity()`, `addTransaction()` |
| `get_active_prescriptions_data` | `fetchMongo.notify.tool.agent.js` | Notifier | `Prescription.find({approved:true}).populate('user')` |
| `send_medication_email` | `sendEmail.tool.js` | Notifier | None (SMTP via nodemailer) |
| `extract_text_from_url` | `OCR.notify.tool.agent.js` | imgAgent | None (Mistral API call) |

### Dead Tools (wired to dead orchestrator only)

| Tool Name | File |
|-----------|------|
| `check_inventory` | `src/tools/inventory.tool.js` |
| `validate_prescription` | `src/tools/prescription.tool.js` |
| `create_order` | `src/tools/order.tool.js` |
| `check_warehouse` | `src/tools/warehouse.tool.js` |
| `check_refill_eligibility` | `src/tools/refill.tool.js` |

---

## 4. Execution Flows

### 4.1 Chat Flow (user sends message)

```
POST /api/chat
    │
    ▼
chat.controller.js → chatPharma(message)
    │
    ▼
parentChat.agent.js → run(parentAgent, message)
    │
    ├── ROUTE: symptoms/search → receptionist child
    │       │
    │       ├── searchMedByDescription tool
    │       │     └── Medicine.find() → inner matcherAgent AI call → JSON results
    │       ├── checkStock tool
    │       │     └── Medicine.find() (ALL) + Medicine.findOne()
    │       └── describeMed tool
    │             └── Medicine.findOne()
    │
    └── ROUTE: buy/order → order child
            │
            └── order_medicine tool
                  ├── Medicine.findOne() (by name regex)
                  ├── reduceQuantity() → Medicine.findOneAndUpdate() atomic
                  └── addTransaction() → Order.save()

Response → chat.controller saves to chat_history.json → res.json(result)
```

### 4.2 Prescription Upload Flow

```
POST /api/prescription/upload
    │  (multipart/form-data, auth required)
    ▼
prescription.controller.js
    ├── User.findById(req.user.id)
    ├── uploadToCloudinary(req.file.buffer) → Cloudinary URL
    ├── runImageExtraction(imageUrl)
    │     └── run(imgAgent, `Extract data from: ${url}`)
    │           └── ocrTool.execute()
    │                 ├── fetch(imageUrl) → ArrayBuffer
    │                 ├── Buffer.toString('base64')
    │                 └── mistral.ocr.process({imageUrl: dataUri})
    │
    ├── If NOT prescription → return 200 with isPrescription:false
    └── If IS prescription → Prescription.findOneAndUpdate() upsert
          └── res.json({ success, imageUrl, recordId, medications })
```

### 4.3 Medication Notification Flow (Cron)

```
notification.schedule.js (SEPARATE FILE — NOT IMPORTED IN app.js)
    │  cron: 08:30 daily
    ▼
run(medicationNotifyAgent, "The current time is HH:mm. Step 1: Fetch...")
    │
    ├── fetchDosesTool.execute()  [ignores currentTime param — bug]
    │     └── Prescription.find({approved:true}).populate('user')
    │           → filter by isActive + expiry date
    │           → return activeMedications[]
    │
    └── sendEmailTool.execute({ email, userName, medicineName, dosage, instructions })
          └── nodemailer.createTransport() [created fresh each call]
                └── transporter.sendMail()
```

### 4.4 Admin Dashboard Flow

```
GET /api/admin/stats (NO AUTH — open to public)
    └── Promise.all([
          Order.countDocuments({createdAt >= today}),
          Order.countDocuments({status: pending|awaiting_prescription}),
          Medicine.countDocuments({$expr: {$lte: [stock, lowStockThreshold]}}),
          RefillAlert.countDocuments({status: active})
        ])
        + Order.find().populate(...).sort().limit(5)
```

---

## 5. Environment Variables

| Variable | Used In | Required | Notes |
|----------|---------|----------|-------|
| `MONGODB_URI` | `config/db.js` | YES | MongoDB Atlas connection string |
| `OPENAI_API_KEY` | `config/openai.js` | YES | Used for chat (gpt-4o), TTS (tts-1), and `@openai/agents` SDK |
| `MISTRAL_API_KEY` | `OCR.notify.tool.agent.js` | YES | Mistral OCR for prescription image parsing |
| `EMAIL_USER` | `sendEmail.tool.js`, `email.service.agent.js` | YES | Gmail address for sending emails |
| `EMAIL_PASS` | `sendEmail.tool.js`, `email.service.agent.js` | YES | Gmail App Password (not account password) |
| `CLOUDINARY_CLOUD_NAME` | `config/cloudinary.js` | YES | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `config/cloudinary.js` | YES | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `config/cloudinary.js` | YES | Cloudinary API secret |
| `JWT_SECRET` | `auth.middleware.js`, `auth.controller.js` | YES | Falls back to `'pharmacy_jwt_secret_dev'` — INSECURE |
| `JWT_EXPIRES` | `auth.controller.js` | No | Defaults to `'7d'` |
| `PORT` | `app.js` | No | Defaults to `5000` |
| `NODE_ENV` | `app.js` | No | `'production'` enables combined logs and hides stack traces |

**Hidden assumption:** The `@openai/agents` SDK uses `OPENAI_API_KEY` from the environment automatically — it does not go through `config/openai.js`.

---

## 6. Database Models

| Model | Collection | Key Fields | Notes |
|-------|-----------|------------|-------|
| `User` | users | name, email, password(select:false), role, age, gender | Password hashed with bcrypt salt=12 |
| `Medicine` | medicines | name, pzn(unique), price, stock, prescriptionRequired, lowStockThreshold | Missing: dosage field but referenced in tools |
| `Order` | orders | user(ref), items[{medicine:String,dosage,quantity}], status, prescription, prescriptionProof | `items.medicine` is `String` not `ObjectId` — cannot be populated |
| `Prescription` | prescriptions | user(ref), prescriptions[{imageUrl, extractedData[], isActive}], approved | extractedData schema missing `name` field |
| `RefillAlert` | refillalerts | user(ref), medicine(ref), estimatedDepletionDate, status | No automation to create alerts from orders |
| `InventoryLog` | inventorylogs | medicine(ref), changeType, quantity, order(ref) | No required constraints on changeType/quantity |

---

## 7. Critical Bugs & Issues

### SEVERITY: CRITICAL (will break in production)

---

**BUG-01: notification.schedule.js is never started**
**File:** `src/app.js`, `src/scheduler/notification.schedule.js`

`app.js` only calls `initScheduler()` from `refill.scheduler.js`. The medication notification cron job (`notification.schedule.js`) is **never imported or started** anywhere in the application startup. Medication reminder emails will never be sent automatically.

**Fix:** Add `import '../scheduler/notification.schedule.js'` inside `src/app.js` after the DB connects, or refactor it to export a function like `initScheduler` does and call it in `start()`.

---

**BUG-02: Admin routes have zero authentication**
**File:** `src/routes/admin.routes.js`

Every route under `/api/admin` — stats, full order list, prescription approval, inventory update, restock — is completely open. No `protect` middleware, no `restrictTo` middleware. Any unauthenticated HTTP request can read all patient data or approve prescriptions.

**Fix:** Add `import { protect, restrictTo } from '../middleware/auth.middleware.js'` and apply `router.use(protect, restrictTo('admin', 'pharmacist'))` at the top of the admin router.

---

**BUG-03: fetchDosesTool ignores its declared parameter**
**File:** `src/agent/tools/notify_tool/fetchMongo.notify.tool.agent.js` (line 11)

```js
// Schema declares parameter:
parameters: z.object({ currentTime: z.string() })

// But execute function ignores it:
execute: async () => { ... }
```

The agent passes `currentTime` to this tool but the function never receives it and never uses it. The time-window comparison logic described in the agent's instructions (`medicationNotifyAgent`) is **never actually executed** — the tool returns ALL active medications regardless of time, and the AI must decide what to send based on the text context alone. This is unreliable.

**Fix:** Change execute signature to `execute: async ({ currentTime }) => { ... }` and implement time-window filtering in the function itself rather than relying on the AI to filter.

---

**BUG-04: checkStock tool dumps entire Medicine collection on every call**
**File:** `src/agent/tools/chat/checkStock.chat.tools.agent.js` (lines 22–23)

```js
const all = await Medicine.find();  // fetches EVERY medicine document
console.log(all);                   // dumps to server logs
```

These are debug lines that were never removed. Every stock check call fetches the full medicine collection and logs it. In production with 1000+ medicines, this will cause severe memory pressure and response latency.

**Fix:** Delete lines 22–23 entirely.

---

**BUG-05: Double stock deduction**
**Files:** `src/agent/tools/chat/order.chat.tools.agent.js`, `src/controllers/admin.controller.js` (line 112)

The AI chat flow deducts stock immediately when placing an order via `reduceQuantity()`. Then when an admin marks the order as `dispatched`, `admin.controller.js` deducts stock again from the same medicine. A single AI-placed order causes double stock reduction.

**Fix:** Remove the `reduceQuantity()` call from `order.chat.tools.agent.js`. Stock should only be deducted once — either at order creation (pre-reserve) or at dispatch (actual fulfillment), not both. For a pharmacy context, deducting at dispatch is more correct.

---

**BUG-06: `items.medicine` in Order model is String, not ObjectId**
**File:** `src/models/order.model.js` (line 5–7), `src/agent/service/addTxn.service.agent.js` (line 38)

The `orderItemSchema.medicine` field is declared as `type: String`. The `addTransaction` service stores `medicine: productName` (the medicine name string). But `admin.controller.js` calls `.populate('items.medicine', 'name')` — you cannot populate a String field. The populate call silently returns nothing. The admin dashboard's recent orders panel will always show missing medicine names.

Additionally, the seed data and `order.tool.js` (dead code path) store the ObjectId here, creating inconsistent data types in the same collection field.

**Fix:** Change `orderItemSchema.medicine` to `type: mongoose.Schema.Types.ObjectId, ref: 'Medicine'`. Update `addTransaction` to accept and store `medicineId` (ObjectId) instead of `productName`. Update `order.chat.tools.agent.js` to pass `medicine._id`.

---

**BUG-07: Prescription extractedData schema missing `name` field**
**File:** `src/models/prescription.model.js` (lines 4–13)

The embedded `medicineSchema` inside Prescription does not include a `name` field. Mongoose strict mode will silently drop the `name: med.name` mapping in `prescription.controller.js` (line 54). Consequently, `fetchMongo.notify.tool.agent.js` returns `medicine_name: med.name` which will be `undefined` for all medications, and the email agent will send reminders with blank medicine names.

**Fix:** Add `name: { type: String }` to the embedded `medicineSchema` in `prescription.model.js`.

---

**BUG-08: Email recipient hardcoded in order confirmation service**
**File:** `src/agent/service/email.service.agent.js` (line 21)

```js
to: "2023bcs035@sggs.ac.in", // TODO: replace with dynamic recipient
```

Every order confirmation email goes to a developer's personal college email. The `patientId` is available in the function signature but the actual patient email is never fetched. This function is currently never called (the order tool does not invoke it), but if wired up, it would spam one person's inbox.

**Fix:** Accept `patientEmail` as a parameter, or query `User.findById(patientId).select('email')` inside the function.

---

**BUG-09: Global chat_history.json shared across all users**
**File:** `src/controllers/chat.controller.js` (lines 11–24)

All users' conversations are appended to a single `chat_history.json` file with no user identifier. Issues:
- Any user calling `GET /api/chat/history` sees ALL users' messages — **data privacy violation**
- No authentication on either chat endpoint
- Concurrent writes (two users chatting simultaneously) can corrupt the file
- The file grows forever with no pruning

**Fix:** Store chat history in MongoDB (`ChatSession` collection keyed by `userId`). Add `protect` middleware to `/api/chat`. Return only the requesting user's history.

---

### SEVERITY: HIGH (incorrect behavior, security risk)

---

**BUG-10: JWT_SECRET falls back to a public predictable value**
**File:** `src/middleware/auth.middleware.js` (line 4), `src/controllers/auth.controller.js` (line 5)

```js
const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_jwt_secret_dev';
```

If `JWT_SECRET` is missing from `.env` in any deployment, all tokens are signed with a publicly visible key. Anyone who reads this source code can forge valid JWTs for any user including admins.

**Fix:** Remove the fallback and throw an error on startup if `JWT_SECRET` is not set: `if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be set')`.

---

**BUG-11: `/api/prescription/mail` is an unauthenticated public endpoint**
**File:** `src/routes/notification.routes.js` (line 10)

```js
router.post('/mail', testMailer.testEmail);
```

Any anonymous actor can POST `{"testTime": "08:30"}` to this endpoint and trigger the full AI agent run — fetching all active prescriptions from the database and sending emails to real patients. This is also a cost attack vector (unlimited OpenAI + email API calls).

**Fix:** Add `protect, restrictTo('admin')` middleware to this route. Remove it from production or gate it behind a secret key.

---

**BUG-12: `order.tool.js` auto-creates phantom users**
**File:** `src/tools/order.tool.js` (lines 25–27) — dead code path

```js
user = await User.create({
  name: patientName,
  email: `${patientName.toLowerCase().replace(/\s/g, '.')}@patient.local`,
  role: 'customer'
});
```

If a patient name doesn't exist in the DB, a fake account is created with a `.local` email and no password. These ghost accounts cannot log in but can be found and targeted. This code path is dead (orchestrator is unused) but if wired up, would be dangerous.

**Fix:** Return an error instead of creating phantom users: `return { success: false, message: 'Patient not found. Please register first.' }`.

---

**BUG-13: No rate limiting on any endpoint**
**File:** `src/app.js`

The `/api/chat` endpoint invokes multiple AI API calls (OpenAI Agents SDK) per request. There is no rate limiting, throttling, or per-user quota. A single user or a script can exhaust OpenAI API credits in minutes.

**Fix:** Add `express-rate-limit` middleware, especially on `/api/chat` and `/api/tts`. Example: 10 requests per minute per IP for chat.

---

**BUG-14: Webhook endpoint is unauthenticated and processes nothing**
**File:** `src/routes/webhook.routes.js`

The webhook endpoint accepts any POST from any source, logs the body, and returns `{received: true}`. No signature verification, no processing logic, no authentication. Anyone can send fake webhook events.

**Fix:** Add webhook signature verification (HMAC with a shared secret). If unused, remove the route.

---

**BUG-15: `searchMedByDescription` sends all inventory to AI in one prompt**
**File:** `src/agent/tools/chat/searchMed.chat.tools.agent.js` (lines 41–65)

All in-stock medicines (potentially hundreds) with their descriptions are serialized into a single prompt sent to the AI. With 30+ medicines from the seed, the prompt is already large. At 500+ medicines, this will exceed token limits and fail.

Additionally, this tool spawns an **inner agent** (`matcherAgent`) inside a tool execution, creating unbounded nested AI calls with no cost cap.

**Fix:** Implement vector embeddings (e.g., MongoDB Atlas Vector Search or pgvector) for semantic medicine search instead of sending the full catalog to the AI. If not feasible short-term, limit results to top 20 by name relevance before AI ranking.

---

**BUG-16: nodemailer transporter created fresh on every email**
**File:** `src/agent/tools/notify_tool/sendEmail.tool.js` (line 16)

```js
execute: async (...) => {
  const transporter = nodemailer.createTransport({ ... });  // inside execute
```

A new SMTP connection is established for every single email. This is slow and can exhaust connection limits. If the notification agent sends 50 emails in one run, 50 separate SMTP connections are opened.

**Fix:** Create the transporter once outside the `execute` function, at module scope.

---

### SEVERITY: MEDIUM (incomplete, misleading, or bad practice)

---

**BUG-17: Dead orchestrator import in chat controller**
**File:** `src/controllers/chat.controller.js` (line 1)

```js
import { runOrchestrator } from "../agent/orchestrator.agent.js";
```

`runOrchestrator` is imported but never called anywhere in the file. This import is dead code that still loads the module, initializes the OpenAI client reference, and adds startup cost. It also misleads developers into thinking the orchestrator is active.

**Fix:** Remove the import entirely. If the orchestrator is being deprecated, delete `src/agent/orchestrator.agent.js` and `src/tools/` as well.

---

**BUG-18: OCR hardcodes `image/png` MIME type**
**File:** `src/agent/tools/notify_tool/OCR.notify.tool.agent.js` (line 34)

```js
const dataUri = `data:image/png;base64,${base64Data}`;
```

Prescriptions uploaded as JPG, JPEG, or WebP will be misidentified to Mistral as PNG. Some models reject mismatched MIME types silently or return garbled OCR output.

**Fix:** Detect the actual content type from the HTTP response headers: `const contentType = response.headers.get('content-type') || 'image/png'` and use that in the data URI.

---

**BUG-19: `OCR.service.agent.js` is entirely dead code**
**File:** `src/agent/service/OCR.service.agent.js`

This file exports `getBase64Image(filePath)` which reads from the local filesystem. The current OCR pipeline uses Cloudinary URLs, not local files. Nothing imports or calls this function. It references a commented-out Mistral client.

**Fix:** Delete this file.

---

**BUG-20: `updateInventory` is an unvalidated full-body update**
**File:** `src/controllers/admin.controller.js` (line 49)

```js
const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
```

The entire `req.body` is passed directly to `findByIdAndUpdate`. An attacker with admin access can modify any field on the Medicine document, including `pzn` (which has a unique index) or set `stock` to a negative number. There's also no `runValidators: true` option, so Mongoose schema validators (like `min: 0` on price) are bypassed.

**Fix:** Whitelist the allowed fields: only allow `{ stock, price, description, lowStockThreshold }` to be updated. Add `{ runValidators: true }` to the update options.

---

**BUG-21: `RECOMMENDED_PROMPT_PREFIX` import path may fail**
**File:** `src/agent/parent/parentChat.agent.js` (line 2)

```js
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";
```

This imports from a sub-path of `@openai/agents-core`. If this sub-path is not exposed in the package's `exports` map (varies by version), this import will throw `ERR_PACKAGE_PATH_NOT_EXPORTED` and the entire parent agent module will fail to load, breaking all chat functionality.

**Fix:** Verify this import works with the installed version. If it fails, remove this prefix or inline the prompt injection safety text directly into the instructions.

---

**BUG-22: `updateOrderStatus` dispatched stock deduction uses inconsistent ID type**
**File:** `src/controllers/admin.controller.js` (lines 112–117)

```js
await Medicine.findByIdAndUpdate(item.medicine._id || item.medicine, ...)
```

This fallback `item.medicine._id || item.medicine` exists because `items.medicine` is a `String` in the schema (not an ObjectId ref). When `.populate()` fails (because it can't populate a String), `item.medicine` is a raw string (medicine name), and `findByIdAndUpdate` with a name string will always fail silently — returning `null`. Stock is not actually deducted for AI-placed orders when dispatched.

**Fix:** This is downstream of BUG-06. Fix the schema first.

---

**BUG-23: `safeRole` assignment is broken**
**File:** `src/controllers/auth.controller.js` (line 36)

```js
const safeRole = role === 'customer' ? 'customer' : 'customer';
```

Both branches return `'customer'`. The intent was to prevent users from self-assigning admin/pharmacist roles, but this implementation means **even if `role: 'customer'` is passed, it still becomes 'customer'** — which is correct behavior, but the ternary is pointless. If the intent was to default non-customer inputs to customer, the else branch should be `'customer'` (which it already is). This is harmless but indicates a typo or incomplete thought.

**Fix:** Simplify to `const safeRole = 'customer';` since registration always creates customers.

---

**BUG-24: Refill alerts are never auto-created from orders**
**File:** `src/tools/order.tool.js`, `src/agent/tools/chat/order.chat.tools.agent.js`

Neither the active (`order.chat.tools.agent.js`) nor the dead (`order.tool.js`) order creation path ever creates a `RefillAlert`. The refill scheduler checks for existing alerts but since none are ever created programmatically from orders, the refill system is effectively non-functional for AI-placed orders. The seed data manually inserts alerts.

**Fix:** After a successful order that includes a prescription-required medicine, create or upsert a `RefillAlert` with an estimated depletion date based on quantity and dosage frequency.

---

**BUG-25: `inventoryLog.model.js` fields lack `required` constraints**
**File:** `src/models/inventoryLog.model.js`

`changeType`, `quantity`, and `medicine` can all be `undefined`. Logs missing these fields provide no audit value.

**Fix:** Add `required: true` to `medicine`, `changeType`, and `quantity`.

---

**BUG-26: `getTraces` returns an empty array placeholder**
**File:** `src/controllers/admin.controller.js` (lines 203–205)

```js
export const getTraces = async (req, res) => {
  res.json({ traces: [] });
};
```

The admin dashboard has a traces panel that will always show empty. There is no mechanism to capture or store AI reasoning traces anywhere.

**Fix:** Either implement trace logging (capturing `toolCalls` from agent runs to MongoDB) or remove the endpoint and the frontend panel.

---

## 8. Integration Plan

### 8.1 Connecting Agents with Node.js/Express Backend

The agents are Node.js modules that can be imported directly. The integration is already partially done but needs hardening.

**Current state:** Agents are imported directly in controllers and called inline.
**Problem:** Agent calls are blocking, untracked, and have no timeout or retry mechanism.

**Recommended pattern:**

```
Request → Controller → Agent Service Layer → Agent → Tool → MongoDB
                              ↑
                    (timeout, error boundary, logging)
```

Create an `src/services/agent.service.js` wrapper:

```js
// Pseudocode pattern (do not use as-is)
export async function runChatAgent(message, userId, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await chatPharma(message);  // your existing call
    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Agent timed out');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
```

### 8.2 Connecting Agents with MongoDB

All agents use Mongoose models directly. The connection is established in `connectDB()` before the server starts. This is correct.

**Issues to fix:**
1. Ensure `connectDB()` is always awaited before any agent tool can run
2. Add connection retry logic in `config/db.js`
3. Add `mongoose.connection.on('error', ...)` handler for runtime disconnections
4. Agent tools should check `mongoose.connection.readyState === 1` before querying

**Schema fixes required before production (from Bug analysis above):**
- `Order.items[].medicine`: change from `String` to `ObjectId ref:'Medicine'`
- `Prescription.prescriptions[].extractedData`: add `name: String` field
- `InventoryLog`: add `required: true` to `medicine`, `changeType`, `quantity`

### 8.3 How Frontend Should Interact with Agents

**Chat Interface:**
```
POST /api/chat
Headers: Authorization: Bearer <jwt>   ← ADD THIS — currently not required
Body: { "message": "Do you have Paracetamol?" }

Response: {
  "finalOutput": "Yes, Paracetamol 500mg is in stock..."
  // Note: currently returns chatPharma() string, not {text, toolCalls}
  // The controller logs result.text but chatPharma returns a string
  // This shape mismatch needs fixing
}
```

**Prescription Upload:**
```
POST /api/prescription/upload
Headers: Authorization: Bearer <jwt>
Body: multipart/form-data, field name: "prescriptions", single image file

Response: {
  "success": true,
  "isPrescription": true,
  "medications": [...],
  "imageUrl": "https://res.cloudinary.com/..."
}
```

**TTS (Text-to-Speech):**
```
POST /api/tts          → returns audio/mpeg binary buffer
POST /api/tts/stream   → chunked transfer, play while loading
Body: { "text": "Paracetamol is available." }
```

**Frontend integration notes:**
- Chat history is currently global (BUG-09). Until fixed, do not show `/api/chat/history` to end users.
- The chat endpoint returns the raw string from `chatPharma()`, not the `{text, toolCalls}` object. The controller at line 39 does `ai: result.text` but `result` is a string, making `result.text` undefined. Fix this by having `chatPharma` return `{ text: result.finalOutput }` or adjust the controller.

### 8.4 API Structure Recommendations

```
/api/auth
  POST   /register          Public
  POST   /login             Public
  GET    /me                Protected (any role)

/api/chat
  POST   /                  Protected (customer)  ← ADD auth
  GET    /history           Protected (customer, own history only)  ← SCOPE this

/api/prescription
  POST   /upload            Protected (customer)
  GET    /mine              Protected (customer) — ADD this

/api/admin
  All routes: Protected + restrictTo('admin','pharmacist')   ← ADD this

/api/tts
  POST   /                  Protected (customer)  ← ADD auth
  POST   /stream            Protected (customer)  ← ADD auth

/api/webhook
  POST   /                  HMAC-verified only    ← FIX this

/api/health
  GET    /                  Public (keep as-is)
```

### 8.5 Folder Structure Recommendations

The current structure is mostly clean. Key changes:

```
src/
  agent/
    parent/
      parentChat.agent.js        ← keep
    child/
      chat/
        receptionist.*.js        ← keep
        order.*.js               ← keep
      notify/
        medication.*.js          ← keep
        img_data_extractor.*.js  ← keep
    tools/
      chat/                      ← keep (active tools)
      notify_tool/               ← keep (active tools)
    service/
      addTxn.service.agent.js    ← keep
      reduceQuantity.service.js  ← keep
      email.service.agent.js     ← FIX hardcoded email
      OCR.service.agent.js       ← DELETE (dead)
    prompts.js                   ← belongs to dead orchestrator, move or delete

  # DELETE ENTIRE: (dead orchestrator system)
  agent/orchestrator.agent.js
  tools/inventory.tool.js
  tools/prescription.tool.js
  tools/order.tool.js
  tools/warehouse.tool.js
  tools/refill.tool.js

  scheduler/
    refill.scheduler.js          ← keep, already integrated
    notification.schedule.js     ← INTEGRATE into app.js startup

  services/
    agent.service.js             ← CREATE: timeout wrapper for agent calls
    chat.session.service.js      ← CREATE: replace chat_history.json

  models/
    chatSession.model.js         ← CREATE: per-user chat history in MongoDB
```

### 8.6 Deployment Considerations

**Environment:**
- Set `NODE_ENV=production` in deployment
- Set a strong `JWT_SECRET` (min 32 random chars, never commit to git)
- Use MongoDB Atlas with IP allowlist and TLS enabled
- Use Cloudinary signed URLs for prescription images in production

**Process Management:**
- Use PM2 or a Docker container with restart policy
- The cron jobs (`refill.scheduler`, `notification.schedule`) run in-process. For horizontal scaling (multiple instances), these will fire N times. **Move cron jobs to a dedicated worker process or use a distributed scheduler** (e.g., BullMQ + Redis) before scaling beyond one instance.

**API Cost Control:**
- Add `express-rate-limit` to `/api/chat` (e.g., 20 req/min per user)
- Add `express-rate-limit` to `/api/tts` (e.g., 30 req/min per user)
- Add `express-rate-limit` to `/api/prescription/upload` (e.g., 5 req/min per user)
- Set a max token budget or timeout on agent runs to prevent runaway loops
- The `searchMedByDescription` tool spawns a nested AI agent — monitor token usage closely

**Secrets Management:**
- Never commit `.env` to git (add to `.gitignore`)
- Use DigitalOcean App Platform environment variables or a secrets manager in production
- Rotate `OPENAI_API_KEY` and `MISTRAL_API_KEY` if they are ever exposed

**Logging:**
- The `utils/logger.js` writes to console. In production, route logs to a persistent service (e.g., Datadog, Papertrail, or write to file with rotation)
- Remove all raw `console.log(all)` debug statements (BUG-04)

---

## Quick Fix Priority List

| Priority | Bug # | Action |
|----------|-------|--------|
| P0 | BUG-02 | Add auth middleware to all admin routes |
| P0 | BUG-09 | Stop exposing all users' chat history publicly |
| P0 | BUG-04 | Remove `Medicine.find()` + `console.log(all)` debug dump |
| P0 | BUG-01 | Import and start notification.schedule.js in app.js |
| P1 | BUG-05 | Remove double stock deduction |
| P1 | BUG-06 | Fix Order.items.medicine schema to use ObjectId |
| P1 | BUG-07 | Add `name` field to Prescription.extractedData schema |
| P1 | BUG-03 | Pass and use `currentTime` in fetchDosesTool |
| P1 | BUG-10 | Remove JWT_SECRET fallback, fail on startup if missing |
| P1 | BUG-11 | Add auth to /api/prescription/mail |
| P1 | BUG-13 | Add rate limiting to /api/chat and /api/tts |
| P2 | BUG-17 | Remove dead orchestrator import from chat.controller |
| P2 | BUG-08 | Fix hardcoded email recipient |
| P2 | BUG-16 | Move nodemailer transporter to module scope |
| P2 | BUG-18 | Fix hardcoded image/png MIME type in OCR tool |
| P2 | BUG-20 | Whitelist allowed fields in updateInventory |
| P3 | BUG-15 | Replace full-catalog AI search with vector search |
| P3 | BUG-19 | Delete dead OCR.service.agent.js |
| P3 | BUG-24 | Auto-create RefillAlerts when orders are placed |
| P3 | BUG-26 | Implement trace logging or remove the placeholder |
