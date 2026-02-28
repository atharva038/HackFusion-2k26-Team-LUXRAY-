---
sidebar_position: 2
title: Order Management
---

# Order Management

Orders flow through a well-defined lifecycle with real-time Socket.IO events at each transition.

---

## Order Lifecycle

```
User says "Order Paracetamol 2 strips"
        │
        ▼
Agent tool: createOrder()
        │
        ▼
Order created  →  status: "pending"
                  paymentStatus: "pending"
        │
        ▼
Razorpay order created  →  status: "awaiting_payment"
        │
        ▼
User completes payment
        │
        ▼
Razorpay webhook → POST /api/payment/webhook
        │
        ▼
Signature verified → status: "paid", paymentStatus: "paid"
Socket event → order:status-updated (to user)
        │
        ▼
Admin reviews in dashboard
        │
   ┌────┴─────┐
   │          │
Approve     Reject
   │          │
status:     status: "rejected"
"approved"  + rejectionReason
   │          │
   └────┬─────┘
        │
Socket event → order:status-updated
        │
        ▼ (if approved)
Admin dispatches
        │
        ▼
status: "dispatched"
Socket event → order:dispatched  ←── triggers screen recording stop + upload
```

---

## Order Status Enum

| Status | Description |
|---|---|
| `pending` | Just created, awaiting payment |
| `awaiting_payment` | Razorpay order created, user redirected |
| `paid` | Payment confirmed via webhook |
| `approved` | Admin reviewed and approved |
| `rejected` | Admin rejected (with reason) |
| `awaiting_prescription` | Rx medicine — prescription not yet verified |
| `dispatched` | Shipped to customer |

---

## Socket Events

### Events emitted to the **user** (`user:<userId>` room)

```javascript
// Status changed
socket.emit('order:status-updated', {
  orderId, status, rejectionReason, approvedBy, totalAmount
});

// Dispatched
socket.emit('order:dispatched', {
  orderId,
  message: 'Your order has been dispatched!'
});

// Rejected
socket.emit('order:rejected', {
  orderId, reason
});
```

### Events broadcast to **all admins**

```javascript
socket.emit('order:admin-updated', {
  orderId, status, userName, rejectionReason, approvedBy, totalAmount
});
```

---

## Prescription-Required Orders

If any item in the order has `prescriptionRequired: true`:

1. Agent calls `validatePrescription()` tool
2. If user has valid, approved prescription → order proceeds
3. If not → status set to `awaiting_prescription`
4. User prompted to upload prescription via `PrescriptionUpload` component
5. Admin approves prescription → order status updates

---

## Invoice Generation

On order dispatch:
1. `invoicePdf.service.js` generates PDF invoice (pdfkit)
2. Invoice sent to user via email (Resend) and WhatsApp (Twilio)
3. Invoice also downloadable from `MyOrders` page via jsPDF (client-side)

---

## Admin Order Management

Endpoint: `PATCH /api/admin/orders/:id`

```json
{
  "status": "approved" | "rejected" | "dispatched",
  "rejectionReason": "optional string"
}
```

On status change:
- MongoDB order updated
- Inventory deducted (on dispatch): `inventory.service.js`
- `InventoryLog` created for audit
- Socket events emitted to user + admins
- Email/WhatsApp notifications sent

---

## Inventory Deduction

When an order is dispatched, stock is deducted:

```javascript
// For each item in the order:
medicine.stock -= item.quantity;
await medicine.save();

// Audit log:
InventoryLog.create({
  medicine: item.medicine,
  changeType: 'deduct',
  quantity: item.quantity,
  order: orderId,
});

// If below threshold → emit low-stock alert
if (medicine.stock < medicine.lowStockThreshold) {
  io.emit('inventory:low-stock-alert', { medicine });
}
```
