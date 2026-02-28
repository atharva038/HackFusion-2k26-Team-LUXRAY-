---
sidebar_position: 8
title: Recording API
---

# Session Recording API

Base path: `/api/recording`

Handles uploading screen-recorded pharmacy consultation sessions to Cloudinary.

---

## `POST /api/recording/upload`

Upload a session recording video. The video is stored in Cloudinary under the `session_recordings` folder and linked to the user's prescription document.

### Auth

Required (`Authorization: Bearer <token>`)

### Request

```
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
  recording   — video file (webm/mp4, max 500MB)
  orderId     — string, the order ID associated with this session
```

### Response `200`

```json
{
  "success": true,
  "sessionVideoUrl": "https://res.cloudinary.com/your-cloud/video/upload/session_recordings/abc123.mp4"
}
```

### Behavior

1. Validates that the order exists and belongs to `req.user`
2. Uploads video to Cloudinary:
   ```javascript
   cloudinary.uploader.upload_stream({
     folder: 'session_recordings',
     resource_type: 'video',
   })
   ```
3. Finds the user's `Prescription` document
4. Updates:
   ```javascript
   prescription.sessionVideoUrl = cloudinaryUrl;
   prescription.sessionRecordingOrderId = orderId;
   ```
5. Returns the Cloudinary URL

### Errors

| Status | Error |
|---|---|
| `400` | No video file or missing orderId |
| `401` | Unauthorized |
| `403` | Order does not belong to user |
| `404` | Order not found |
| `413` | File too large (> 500MB) |
| `415` | Not a video file |
| `500` | Cloudinary upload failed |

---

## Multer Configuration

```javascript
export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },  // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'), false);
  },
});
```

Route registration in `app.js`:

```javascript
import recordingRoutes from './routes/recording.routes.js';
app.use('/api/recording', recordingRoutes);
```

Route definition:

```javascript
router.post(
  '/upload',
  protect,
  uploadVideo.single('recording'),
  uploadSessionRecording
);
```
