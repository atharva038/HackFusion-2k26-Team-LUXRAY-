---
sidebar_position: 1
title: Authentication
---

# Authentication API

Base path: `/api/auth`

All auth endpoints are public (no JWT required). Tokens returned from login/register must be stored client-side and sent with every subsequent request as:

```
Authorization: Bearer <token>
```

---

## `POST /api/auth/register`

Register a new customer account.

### Request

```json
{
  "name": "Aditya Raut",
  "email": "aditya@example.com",
  "password": "securepass123",
  "phone": "+919876543210",   // optional
  "age": 25,                  // optional
  "gender": "male"            // optional: "male" | "female" | "other"
}
```

### Response `201`

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f...",
    "name": "Aditya Raut",
    "email": "aditya@example.com",
    "role": "customer"
  }
}
```

### Errors

| Status | Error |
|---|---|
| `400` | Missing required fields |
| `409` | Email already registered |
| `422` | Password too short (< 6 chars) |

---

## `POST /api/auth/login`

Authenticate any user (customer, admin, pharmacist).

### Request

```json
{
  "email": "aditya@example.com",
  "password": "securepass123"
}
```

### Response `200`

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f...",
    "name": "Aditya Raut",
    "email": "aditya@example.com",
    "role": "customer",
    "phone": "+919876543210",
    "allergies": []
  }
}
```

### Errors

| Status | Error |
|---|---|
| `400` | Missing email or password |
| `401` | Invalid email or password |

---

## `GET /api/auth/me`

Get the currently authenticated user's profile.

### Headers

```
Authorization: Bearer <token>
```

### Response `200`

```json
{
  "success": true,
  "user": {
    "_id": "64f...",
    "name": "Aditya Raut",
    "email": "aditya@example.com",
    "role": "customer",
    "phone": "+919876543210",
    "age": 25,
    "gender": "male",
    "allergies": [
      {
        "allergen": "penicillin",
        "severity": "high",
        "reaction": "anaphylaxis"
      }
    ]
  }
}
```

---

## Token Details

```
Algorithm: HS256
Expiry:    7 days (configurable via JWT_EXPIRES_IN env var)
Payload:   { id, role, iat, exp }
```

The token is **not** stored server-side (stateless JWT). Store it in `localStorage` under key `pharmacy_token`.
