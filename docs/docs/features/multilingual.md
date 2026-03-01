---
sidebar_position: 7
title: Multilingual Support
---

# Multilingual Support

MediSage supports **English, Hindi, and Marathi**. Translation is fully transparent — users interact in their preferred language while the AI always processes in English.

---

## Demo

| Scenario | Video |
|---|---|
| Chat in Hindi — AI responds in Hindi voice | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_HINDI) |
| Voice input in Marathi + TTS reply | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_MARATHI) |

---

## Translation Flow

```
User types in Hindi: "मुझे पेरासिटामोल चाहिए"
        │
        ▼
multilingual.service.js → translate to English
"I need Paracetamol"
        │
        ▼
AI Agent processes in English
Agent response: "Yes, we have Paracetamol 500mg..."
        │
        ▼
multilingual.service.js → translate back to Hindi
"हाँ, हमारे पास पेरासिटामोल 500mg है..."
        │
        ▼
User receives response in Hindi
```

---

## Language Selection

Users select their language in the chat interface via `LanguageSelector` component.

The choice is persisted to:
- Zustand store: `useAppStore.selectedLanguage`
- LocalStorage (survives page refresh)

---

## Translation Service

`backend/src/services/multilingual.service.js`

Supports two translation backends (configured by environment):
- **Azure Cognitive Services Translator** — production-grade, low latency
- **Claude-3-Sonnet (via Anthropic API)** — fallback, contextually aware

```javascript
// Usage
const translated = await translateText({
  text: userMessage,
  from: 'hi',       // Hindi
  to: 'en',         // English
});
```

---

## Supported Languages

| Language | Code | Input | Output |
|---|---|---|---|
| English | `en` | ✓ | ✓ |
| Hindi | `hi` | ✓ | ✓ |
| Marathi | `mr` | ✓ | ✓ |

---

## Latency Tracking

The backend tracks pre/post translation times separately and logs them:

```javascript
const t0 = Date.now();
const userInEnglish = await translateText(userMessage, lang, 'en');
const translateInMs = Date.now() - t0;

// ... run agent ...

const t1 = Date.now();
const responseInLang = await translateText(agentResponse, 'en', lang);
const translateOutMs = Date.now() - t1;
```

This is stored in the audit log for performance monitoring.

---

## Chat Request with Language

When sending a chat message, the language is passed:

```json
POST /api/chat
{
  "message": "मुझे पेरासिटामोल चाहिए",
  "sessionId": "abc123",
  "language": "hi"
}
```

The response is also in Hindi if `language: "hi"` was set.
