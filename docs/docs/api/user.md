---
sidebar_position: 4
title: User API
---

# User API

Base path: `/api/user`

All endpoints require authentication (`protect` middleware).

---

## `GET /api/user/orders`

Get the authenticated user's order history (paginated).

### Query Parameters

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page (max 50) |

### Response `200`

```json
{
  "success": true,
  "orders": [
    {
      "_id": "64f...",
      "items": [
        {
          "medicine": { "name": "Paracetamol 500mg", "price": 12 },
          "quantity": 2,
          "dosage": "1 tablet twice daily"
        }
      ],
      "status": "dispatched",
      "paymentStatus": "paid",
      "totalAmount": 24,
      "invoiceId": "INV-001234",
      "purchasingDate": "2026-02-28T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "totalPages": 2
}
```

---

## `GET /api/user/prescriptions`

Get the authenticated user's prescriptions with extracted data and session recording.

### Response `200`

```json
{
  "success": true,
  "prescriptions": [
    {
      "_id": "64f...",
      "prescriptions": [
        {
          "imageUrl": "https://res.cloudinary.com/.../prescriptions/abc.jpg",
          "extractedData": [
            {
              "doctor_name": "Dr. Shah",
              "hospital_name": "City Hospital",
              "medi_name": "Amoxicillin",
              "dosage": "500mg",
              "frequency": "3 times daily",
              "duration_days": 7
            }
          ],
          "uploadedAt": "2026-02-28T10:00:00Z",
          "isActive": true
        }
      ],
      "approved": true,
      "sessionVideoUrl": "https://res.cloudinary.com/.../session_recordings/xyz.mp4",
      "sessionRecordingOrderId": "64f..."
    }
  ]
}
```

---

## `GET /api/user/allergies`

Get the authenticated user's allergy list.

### Response `200`

```json
{
  "success": true,
  "allergies": [
    {
      "allergen": "penicillin",
      "severity": "high",
      "reaction": "anaphylaxis"
    }
  ]
}
```

---

## `PUT /api/user/allergies`

Update the authenticated user's allergy list (replaces the entire list).

### Request

```json
{
  "allergies": [
    {
      "allergen": "penicillin",
      "severity": "high",
      "reaction": "anaphylaxis"
    },
    {
      "allergen": "sulfa drugs",
      "severity": "medium",
      "reaction": "rash"
    }
  ]
}
```

### Response `200`

```json
{
  "success": true,
  "allergies": [...]
}
```

:::info Allergy-Aware AI
The AI pharmacist automatically receives the user's allergy list in its context and warns users about potential allergic reactions before recommending or ordering medicines.
:::
