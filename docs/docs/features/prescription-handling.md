---
sidebar_position: 3
title: Prescription Handling
---

# Prescription Handling

MediSage handles prescription images end-to-end: from upload and OCR extraction to admin review and order fulfilment.

---

## Upload Flow

```
User selects image (file picker or camera)
        │
        ▼
POST /api/prescription/upload
  Content-Type: multipart/form-data
  Field: "prescription" (JPEG/PNG ≤ 5MB)
        │
        ▼
Multer validates size + MIME type
        │
        ▼
Cloudinary upload → folder: "prescriptions"
Returns: secure_url
        │
        ▼
AI Image Extractor Agent processes image:
  Extracts structured data:
    - doctor_name
    - hospital_name
    - user_name
    - medi_name (medicine)
    - dosage, frequency
    - total_quantity, duration_days
    - instructions
        │
        ▼
Prescription document updated in MongoDB:
  prescriptions[].imageUrl = cloudinaryUrl
  prescriptions[].extractedData = [...]
        │
        ▼
Admin notified (socket: prescription:admin-updated)
```

---

## Frontend Upload Components

### `PrescriptionUpload.jsx`
- Drag-and-drop or click to upload
- Shows preview of selected image
- Calls `POST /api/prescription/upload`
- Displays extracted data after processing

### `useCamera.js`
- Opens device camera via `getUserMedia`
- Captures photo as Blob
- Passed to the upload flow

### `PrescriptionSelectorModal.jsx`
- Used in chat when user wants to attach existing prescription to an order
- Lists user's approved prescriptions
- User selects which one to link to the current order

---

## Data Schema

Each prescription entry in the `Prescription` document:

```javascript
{
  imageUrl: String,          // Cloudinary URL
  extractedData: [{
    doctor_name: String,     // Required
    hospital_name: String,   // Required
    user_name: String,       // Required
    medi_name: String,       // Required — medicine name on prescription
    dosage: String,
    frequency: String,
    total_quantity: Number,
    duration_days: Number,
    instructions: String,
  }],
  uploadedAt: Date,
  startDate: Date,
  isActive: Boolean,
}
```

---

## Admin Review

Admin opens **Prescriptions** page (`/admin/prescriptions`):

1. Lists all prescriptions with status pending/approved
2. Admin opens `PrescriptionReview.jsx`:
   - Sees the uploaded image
   - Sees AI-extracted data
   - Can edit/correct extracted fields
   - Clicks Approve or Reject

Endpoint: `PATCH /api/admin/prescriptions/:id`

```json
{ "approved": true }
```

On approval:
- `prescription.approved = true`
- Linked order (if any) moves from `awaiting_prescription` → `approved`
- Socket event: `prescription:updated` to the user

---

## Prescription Validation in Orders

When an order is placed for an Rx medicine, the agent calls `validatePrescription()`:

```javascript
// Checks:
// 1. User has a Prescription doc
// 2. prescription.approved === true
// 3. prescription.validUntil > now (if set)
// 4. medi_name in extractedData matches the medicine being ordered

return {
  valid: true | false,
  prescriptionId,
  expiresAt
}
```

---

## Session Video on Prescription

The `Prescription` document also stores the **session recording** for the pharmacist consultation that led to the prescription:

```javascript
{
  sessionVideoUrl: "https://res.cloudinary.com/.../session_recordings/...",
  sessionRecordingOrderId: ObjectId
}
```

This is visible in `MyPrescriptions.jsx` as a `<video>` element with controls.
