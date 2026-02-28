---
sidebar_position: 6
title: Prescription API
---

# Prescription API

Base path: `/api/prescription`

---

## `POST /api/prescription/upload`

Upload a prescription image. The AI extracts structured data automatically.

### Auth

Required. Rate limit: **10 requests/IP/minute**.

### Request

```
Content-Type: multipart/form-data
Authorization: Bearer <token>

Field: prescription  (JPEG or PNG, max 5MB)
```

### Response `200`

```json
{
  "success": true,
  "prescription": {
    "_id": "64f...",
    "prescriptions": [
      {
        "imageUrl": "https://res.cloudinary.com/.../prescriptions/abc.jpg",
        "extractedData": [
          {
            "doctor_name": "Dr. Mehta",
            "hospital_name": "Apollo Hospital",
            "user_name": "Aditya Raut",
            "medi_name": "Amoxicillin",
            "dosage": "500mg",
            "frequency": "3 times daily",
            "total_quantity": 21,
            "duration_days": 7,
            "instructions": "Take after food"
          }
        ],
        "uploadedAt": "2026-02-28T10:00:00Z",
        "isActive": true
      }
    ]
  }
}
```

### Errors

| Status | Error |
|---|---|
| `400` | No file uploaded |
| `413` | File too large (> 5MB) |
| `415` | Unsupported file type (not JPEG/PNG) |
| `500` | Cloudinary upload failed |

---

## `DELETE /api/prescription/:entryId`

Delete a specific prescription entry by its entry ID (the `_id` of the entry inside `prescriptions[]`).

### Auth

Required

### Response `200`

```json
{
  "success": true,
  "message": "Prescription entry deleted"
}
```

---

## `POST /api/prescription/mail` (Admin only)

Send a test email notification. Used for testing the email service.

### Auth

Required (admin/pharmacist)

### Request

```json
{
  "to": "test@example.com",
  "subject": "Test",
  "body": "Test email"
}
```

---

## `POST /api/prescription/testMail` (Admin only)

Trigger the full agent notification system test (dose reminders, refill alerts).

---

## `POST /api/prescription/triggerLowStock` (Admin only)

Directly trigger low-stock email alerts for all under-threshold medicines.
