---
sidebar_position: 4
title: Inventory Management
---

# Inventory Management

Real-time stock tracking with low-stock alerts, automated refill reminders, and a full audit trail.

---

## Medicine Catalog

Each medicine is a `Medicine` document:

```javascript
{
  name: String,                    // e.g. "Paracetamol 500mg"
  pzn: String,                     // Pharmacy product number (unique)
  price: Number,                   // Per unit price
  description: String,
  unitType: "tablet"|"strip"|"bottle"|"injection"|"tube"|"box"|"capsule",
  stock: Number,                   // Current units in stock
  prescriptionRequired: Boolean,   // Rx or OTC
  lowStockThreshold: Number,       // Default: 10
}
```

---

## Stock Operations

### Deduction (on order dispatch)

```
Order dispatched
  → inventory.service.js deducts stock for each item
  → InventoryLog created (changeType: "deduct")
  → If stock < lowStockThreshold → socket + email alert
```

### Restock (admin action)

```
POST /api/admin/inventory/:id/restock
Body: { quantity: 50 }

  → medicine.stock += quantity
  → InventoryLog created (changeType: "restock")
  → Socket event: inventory:medicine-restocked
     { name, previousStock, newStock, quantityAdded }
```

---

## Low-Stock Alerts

### Automatic (triggered on deduction)

When stock drops below `lowStockThreshold` after order dispatch:

```javascript
io.emit('inventory:low-stock-alert', {
  medicine: { name, stock },
  data: { message, severity }
});
```

Admin sees a toast notification in the dashboard.

### Manual Trigger

`POST /api/admin/low-stock-alert`

Scans all medicines below threshold and:
1. Sends email to pharmacists (Resend API)
2. Emits `inventory:low-stock-manual-alert` socket event with count

---

## Refill Reminders

The `RefillAlert` model tracks user refill eligibility:

```javascript
{
  user: ObjectId,
  medicine: ObjectId,
  lastOrderDate: Date,
  estimatedDepletionDate: Date,  // Calculated from dosage/duration
  status: "active"|"notified"|"completed"
}
```

### Daily Scheduler

`refill.scheduler.js` runs via node-cron:

```
Daily at configured time:
  1. Find all RefillAlerts where status = "active"
  2. Calculate days until estimatedDepletionDate
  3. If ≤ 3 days:
     → Send email (Resend)
     → Send WhatsApp (Twilio)
     → Update status to "notified"
  4. Emit: refill:alert-updated socket event
```

### Agent Refill Tool

Users can ask "Refill my aspirin" in chat:

```
Agent → checkRefill() tool
  → Checks lastOrderDate + duration_days
  → If eligible: createOrder() automatically
  → If not eligible: tells user when they will be eligible
```

---

## Inventory Audit Log

Every stock change creates an `InventoryLog`:

```javascript
{
  medicine: ObjectId,
  changeType: "deduct"|"restock",
  quantity: Number,
  order: ObjectId,   // null for manual restocks
  createdAt: Date
}
```

Admin views the full log at `/admin/logs`.

---

## Real-Time Socket Events

| Event | Payload | Trigger |
|---|---|---|
| `inventory:medicine-updated` | `{ medicine }` | Any field change |
| `inventory:medicine-restocked` | `{ name, previousStock, newStock, quantityAdded }` | Restock |
| `inventory:low-stock-alert` | `{ medicine: {name, stock}, data }` | Auto low-stock |
| `inventory:low-stock-manual-alert` | `{ alertedCount, data }` | Manual trigger |
| `refill:alert-updated` | `{ medicine, status, data }` | Refill status change |
