---
sidebar_position: 9
title: Session Screen Recording
---

# Session Screen Recording

MediSage records the user's chat session screen during pharmacist consultations. The recording is automatically stopped when the order is dispatched and uploaded to Cloudinary, then linked to the user's prescription.

---

## Demo

[![Session Recording Demo](https://img.shields.io/badge/▶_Session_Recording_Demo-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_RECORDING)

---

## Flow

```
ChatPage mounts
        │
        ▼
useScreenRecorder.startRecording()
  → browser prompts for screen share + microphone permission
  → MediaRecorder starts capturing display stream
        │
        ▼ (user interacts with pharmacist)
        │
Socket event: order:dispatched received
        │
        ▼
useScreenRecorder.stopRecording()
  → MediaRecorder.stop() called
  → Returns: Blob (video/webm or video/mp4)
        │
        ▼
uploadSessionRecording(blob, orderId)
  → POST /api/recording/upload
  → multipart/form-data, field: "recording"
        │
        ▼
Backend: recording.controller.js
  1. Validate order belongs to req.user
  2. Upload to Cloudinary
     folder: "session_recordings"
     resource_type: "video"
  3. Update Prescription doc:
     sessionVideoUrl = cloudinary.secure_url
     sessionRecordingOrderId = orderId
        │
        ▼
User can view recording on MyPrescriptions page
```

---

## `useScreenRecorder` Hook

Located at: `frontend/src/hooks/useScreenRecorder.js`

```javascript
const { startRecording, stopRecording, uploadSessionRecording } = useScreenRecorder();
```

### `startRecording()`

```javascript
// Requests screen capture + microphone
const displayStream = await navigator.mediaDevices.getDisplayMedia({
  video: { frameRate: 15, width: 1280 },
  audio: true,
});
const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Mix tracks
const combinedStream = new MediaStream([
  ...displayStream.getTracks(),
  ...micStream.getTracks(),
]);

mediaRecorder = new MediaRecorder(combinedStream);
mediaRecorder.start(1000); // 1-second chunks
```

### `stopRecording()`

```javascript
// Returns a Promise<Blob>
mediaRecorder.stop();
// Collects all chunks → new Blob(chunks, { type: 'video/webm' })
```

### `uploadSessionRecording(blob, orderId)`

```javascript
const formData = new FormData();
formData.append('recording', blob, 'session.webm');
formData.append('orderId', orderId);
await api.post('/recording/upload', formData);
```

---

## Backend Endpoint

### `POST /api/recording/upload`

| Property | Value |
|---|---|
| Auth | Required (`protect`) |
| Upload | `uploadVideo.single('recording')` (500MB limit) |
| Cloudinary | `folder: session_recordings`, `resource_type: video` |

**Request:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
  recording  — video Blob (webm/mp4, ≤ 500MB)
  orderId    — string
```

**Response:**
```json
{
  "success": true,
  "sessionVideoUrl": "https://res.cloudinary.com/.../session_recordings/abc123.mp4"
}
```

---

## Viewing Recordings

`MyPrescriptions.jsx` shows a `<video>` element when `entry.sessionVideoUrl` is set:

```jsx
{entry.sessionVideoUrl && (
  <video
    src={entry.sessionVideoUrl}
    controls
    className="w-full rounded-lg mt-2"
  />
)}
```

---

## Multer Configuration for Video

`backend/src/middleware/multer.middleware.js`

```javascript
export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'), false);
  },
});
```
