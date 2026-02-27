Structured properly:

* Clear role
* System constraints
* Architecture separation
* Data contracts
* Observability
* Safety
* Performance
* No Redis assumption included

Below is your complete copy-paste `.md` file.

---

# Multilingual Wrapper Architecture — AI Pharmacy Platform

## 🎯 Objective

Extend the existing **English-only AI pharmacy platform** to support:

* Hindi (हिंदी)
* Marathi (मराठी)
* English (default)

WITHOUT modifying:

* Core Agent Logic
* Tool Architecture
* Service Layer

The AI Agent must remain **English-native internally**.

This implementation must follow a **3-Layer Architecture** approach and introduce a multilingual wrapper around the agent pipeline.

---

# 🏗 3-Layer Architecture Design

```
Presentation Layer (Frontend)
        ↓
Multilingual Orchestration Layer (Wrapper)
        ↓
Core Agent Layer (Unmodified)
```

---

# 🧩 Layer 1 — Presentation Layer (Frontend)

## Responsibilities

* Language Selection UI
* Voice Input (STT)
* Display Translated Messages
* Play Multilingual TTS Output
* Hide Internal English Processing

---

## 1️⃣ Language Selector

Add a dropdown selector in frontend:

Options:

* English (default)
* हिंदी (Hindi)
* मराठी (Marathi)

Store in frontend state:

```js
selectedLanguage = "en" | "hi" | "mr"
```

If no selection → default to `"en"`

---

## 2️⃣ Voice Input Configuration

Use correct STT language codes:

| Language | Code  |
| -------- | ----- |
| English  | en-US |
| Hindi    | hi-IN |
| Marathi  | mr-IN |

If transcription handled in backend:

* Pass `language` parameter explicitly.

---

## 3️⃣ Chat Display Rules

If user selects Hindi:

* Show Hindi user message
* Show Hindi AI response
* Do NOT show internal English translations
* English processing must remain invisible

---

# 🧠 Layer 2 — Multilingual Orchestration Layer (Backend Wrapper)

This layer wraps the existing agent.

It handles:

* Language detection
* Translation
* Response translation
* TTS language selection
* Observability logging

⚠️ This layer must NOT modify agent logic.

---

## Updated Processing Pipeline

```
User Input (any language)
    ↓
Detect / Use Selected Language
    ↓
If NOT English → Translate to English
    ↓
Send English to Agent
    ↓
Receive English Response
    ↓
If NOT English → Translate Response
    ↓
Generate TTS in Selected Language
    ↓
Return Translated Text + Audio
```

---

## 🔄 Pre-Agent Translation

Function:

```
translateToEnglish(text, sourceLanguage)
```

Rules:

* Preserve medicine names
* Preserve brand names
* Preserve numbers
* Preserve dosage units (mg, ml, strips)
* Preserve date formats
* Do NOT translate structured JSON
* Translate only free text

---

## 🔄 Post-Agent Translation

Function:

```
translateFromEnglish(agentResponse, targetLanguage)
```

Rules:

* Preserve:

  * Medicine names
  * Dosage values
  * mg / ml / strips
  * Numeric quantities
  * Brand names
* Maintain medical tone
* Avoid altering prescriptions

---

## 🌐 Language Logic

If:

```
selectedLanguage === "en"
```

Then:

* Skip translation
* Send directly to agent
* Return response directly
* Use English TTS

---

# 🔊 Step 4 — Multilingual TTS

Use OpenAI TTS.

Voice Selection Rules:

| Language | Voice Style                |
| -------- | -------------------------- |
| English  | aria                       |
| Hindi    | Natural Indian female tone |
| Marathi  | Neutral Indian female tone |

Requirements:

* Proper pronunciation
* Calm professional tone
* Healthcare-appropriate pacing
* Clear articulation of medicine names

---

# 🧠 Layer 3 — Core Agent Layer (Unmodified)

The agent:

* Accepts English input only
* Processes using existing tool architecture
* Returns English output
* Remains completely unchanged

DO NOT:

* Modify prompts
* Modify tool logic
* Modify service calls
* Inject multilingual logic into agent

Agent must remain:

> English-native, deterministic, and context-consistent.

---

# 📊 Observability & Tracing Upgrade

Update tracing system to log:

```json
{
  "userLanguage": "",
  "originalText": "",
  "translatedEnglishInput": "",
  "agentEnglishResponse": "",
  "translatedOutput": "",
  "ttsLanguage": "",
  "translationLatency": ""
}
```

Purpose:

* Debug translation drift
* Detect dosage mismatches
* Monitor performance
* Audit medical safety

---

# ⚡ Performance Optimizations

Since Redis is NOT implemented yet:

* Skip translation if language = English
* Avoid translating structured JSON
* Translate only final response text
* Avoid double translation
* Minimize translation calls
* Measure translation latency for future optimization

Future optional optimization:

* Add caching layer once Redis is implemented

---

# 🔐 Safety Constraints

Critical medical safety requirements:

* Numbers must NEVER change
* Dosage units must NEVER change
* mg / ml / strips must remain identical
* Brand names must remain unchanged
* Prescription drug names must remain intact
* Dates must not reformat incorrectly

If translation ambiguity occurs:

* Prefer preserving original medical terms

---

# 🎯 Example Flow

User selects Marathi:

User says:

```
मला अॅम्लोडिपिन ५ मिग्रॅ पाठवा
```

System Flow:

1. Detect language = Marathi
2. Translate to English:
   "Send me Amlodipine 5 mg"
3. Send to agent
4. Agent responds in English
5. Translate response back to Marathi
6. Generate Marathi TTS
7. Return Marathi text + audio

User sees:

Marathi response only.

Agent remains English internally.

---

# 🏆 Final Design Goals

The multilingual system must feel:

* Seamless
* Invisible
* Natural
* Regionally inclusive
* Technically robust
* Medically safe

English core logic must remain intact.

---

# ✅ Implementation Rule

This multilingual system must behave as a **wrapper layer**, not a modification layer.

The core agent is sacred and must not be touched.

---

**End of Multilingual Wrapper Architecture Specification**
