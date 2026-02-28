---
sidebar_position: 8
title: Text-to-Speech (TTS)
---

# Text-to-Speech (TTS)

MediSage supports voice-first interaction with **streaming TTS** for low-latency audio playback and an animated AI avatar that lip-syncs to speech.

---

## Endpoints

### `POST /api/tts` — Buffered TTS

Generates the full audio for the entire text at once.

```json
POST /api/tts
Authorization: Bearer <token>

{
  "text": "Yes, we have Paracetamol in stock."
}
```

Response: `audio/mpeg` binary stream.

### `POST /api/tts/stream` — Streaming TTS

Returns audio incrementally as it generates (lower latency).

```json
POST /api/tts/stream
{
  "text": "Yes, we have Paracetamol in stock."
}
```

Response: chunked `audio/mpeg` stream.

---

## Voice Configuration

The TTS voice is set via environment variable:

```
TTS_VOICE=nova
```

Supported OpenAI TTS voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

---

## Frontend TTS Flow

```
AI response received
        │
        ▼
Split into sentences (sentence boundary detection)
        │
        ▼
Pre-fetch TTS audio for all sentences in parallel
POST /api/tts (for each sentence chunk)
        │
        ▼
Audio chunks stored in array (ArrayBuffer)
        │
        ▼
Play sentences sequentially:
  AudioContext.decodeAudioData(chunk)
  AudioContext.createBufferSource().start()
        │
        ▼
useAudioAmplitude hook reads AnalyserNode
  → Real-time amplitude data (0–255)
  → Drives AiAvatar mouth animation (Framer Motion)
```

---

## Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/tts` | 30 req/user | 1 min |
| `POST /api/tts/stream` | 30 req/user | 1 min |

---

## AI Avatar

`components/avatar/AiAvatar.jsx` renders an animated avatar that reacts to speech:

- Idle state: subtle breathing animation
- Speaking state: mouth opens/closes based on audio amplitude
- Amplitude tracked by `useAudioAmplitude` hook via Web Audio API `AnalyserNode`
- Animation implemented with Framer Motion

```javascript
// useAudioAmplitude.js
const analyser = audioContext.createAnalyser();
source.connect(analyser);
analyser.connect(audioContext.destination);

const getAmplitude = () => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  return Math.max(...dataArray) / 255; // Normalize 0–1
};
```

---

## VoiceButton Component

`features/voice/VoiceButton.jsx`:
- Toggle to enable/disable TTS for AI responses
- When enabled, AI responses are automatically spoken after rendering
- Microphone icon shows recording state
- Uses browser SpeechRecognition API for voice input (input → text → chat)
