---
sidebar_position: 7
title: TTS API
---

# Text-to-Speech API

Base path: `/api/tts`

All endpoints require authentication. Rate limit: **30 requests/user/minute**.

---

## `POST /api/tts`

Generate TTS audio for a given text (buffered — returns full audio at once).

### Request

```json
{
  "text": "Yes, we have Paracetamol 500mg in stock."
}
```

### Response `200`

```
Content-Type: audio/mpeg
Content-Length: <bytes>

<binary audio data>
```

### Usage

```javascript
const res = await api.post('/tts', { text }, { responseType: 'arraybuffer' });
const audioCtx = new AudioContext();
const buffer = await audioCtx.decodeAudioData(res.data);
const source = audioCtx.createBufferSource();
source.buffer = buffer;
source.connect(audioCtx.destination);
source.start();
```

---

## `POST /api/tts/stream`

Generate TTS audio with streaming (lower latency, starts playing before full audio is ready).

### Request

```json
{
  "text": "Yes, we have Paracetamol 500mg in stock."
}
```

### Response `200`

```
Content-Type: audio/mpeg
Transfer-Encoding: chunked

<streaming binary audio chunks>
```

### Usage

```javascript
const res = await fetch('/api/tts/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ text }),
});

// Stream into MediaSource or collect chunks
const reader = res.body.getReader();
const chunks = [];
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  chunks.push(value);
}
const blob = new Blob(chunks, { type: 'audio/mpeg' });
const url = URL.createObjectURL(blob);
const audio = new Audio(url);
audio.play();
```

---

## Voice Configuration

Set via `TTS_VOICE` environment variable on the backend.

| Voice | Character |
|---|---|
| `nova` | Warm, professional (default) |
| `alloy` | Neutral |
| `echo` | Deep, clear |
| `fable` | Expressive |
| `onyx` | Deep, authoritative |
| `shimmer` | Soft, gentle |

---

## Error Responses

| Status | Error |
|---|---|
| `400` | Missing or empty text |
| `401` | Unauthorized |
| `429` | Rate limit exceeded |
| `500` | OpenAI TTS API error |
