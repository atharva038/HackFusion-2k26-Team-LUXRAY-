---
sidebar_position: 3
title: Admin API
---

# Admin API

Base path: `/api/admin`

All endpoints require authentication **and** role `admin` or `pharmacist`.

---

## Dashboard

### `GET /api/admin/stats`

Returns summary statistics for the admin dashboard.

```json
{
  "success": true,
  "stats": {
    "totalOrders": 142,
    "pendingOrders": 8,
    "totalRevenue": 45230,
    "totalMedicines": 56,
    "lowStockCount": 3,
    "activeRefillAlerts": 12
  }
}
```

---

## Inventory

### `GET /api/admin/inventory`

List all medicines with current stock.

```json
{
  "success": true,
  "medicines": [
    {
      "_id": "64f...",
      "name": "Paracetamol 500mg",
      "pzn": "00123456",
      "price": 12,
      "stock": 250,
      "prescriptionRequired": false,
      "lowStockThreshold": 10,
      "unitType": "strip"
    }
  ]
}
```

### `PUT /api/admin/inventory/:id`

Update any medicine field.

```json
{
  "price": 15,
  "lowStockThreshold": 20,
  "description": "Updated description"
}
```

### `POST /api/admin/inventory/:id/restock`

Add stock to a medicine.

```json
{ "quantity": 100 }
```

Response:
```json
{
  "success": true,
  "medicine": { "name": "Paracetamol", "stock": 350 }
}
```

Emits socket: `inventory:medicine-restocked`

### `POST /api/admin/low-stock-alert`

Manually trigger low-stock email alerts for all under-threshold medicines.

---

## Orders

### `GET /api/admin/orders`

List all orders with user and medicine details.

Query params:
- `status` — filter by status
- `page` — pagination (default: 1)
- `limit` — per page (default: 20)

```json
{
  "success": true,
  "orders": [...],
  "total": 142,
  "page": 1
}
```

### `PATCH /api/admin/orders/:id`

Update an order's status.

```json
{
  "status": "approved" | "rejected" | "dispatched",
  "rejectionReason": "Invalid prescription"
}
```

Side effects:
- `approved` → socket `order:status-updated`
- `rejected` → socket `order:rejected`
- `dispatched` → socket `order:dispatched`, inventory deducted, invoice sent

---

## Prescriptions

### `GET /api/admin/prescriptions`

List all prescription submissions.

### `PATCH /api/admin/prescriptions/:id`

Approve or reject a prescription.

```json
{ "approved": true }
```

Emits: `prescription:updated`, `prescription:admin-updated`

---

## Refill Alerts

### `GET /api/admin/refills`

Get all active refill alerts with medicine and user details.

### `PATCH /api/admin/refills/:id`

Update a refill alert status.

```json
{ "status": "completed" }
```

---

## Inventory Logs

### `GET /api/admin/logs`

Get paginated inventory change logs.

```json
{
  "logs": [
    {
      "medicine": { "name": "Paracetamol" },
      "changeType": "deduct",
      "quantity": 2,
      "order": { "_id": "..." },
      "createdAt": "2026-02-28T10:00:00Z"
    }
  ]
}
```

---

## AI Traces

### `GET /api/admin/traces`

Full agent audit logs with user details (admin-only).

---

## Pharmacist Agent

### `POST /api/admin/agent/chat`

Send a message to the pharmacist-grade AI agent (sync).

```json
{
  "message": "What is the maximum daily dose of Ibuprofen?",
  "sessionId": "optional"
}
```

### `POST /api/admin/agent/chat/stream`

Streaming version of the pharmacist agent.

### `GET /api/admin/agent/sessions`

List pharmacist agent sessions.

### `GET /api/admin/agent/history/:sessionId`

Get pharmacist session message history.

### `DELETE /api/admin/agent/sessions/:sessionId`

Delete a pharmacist session.
