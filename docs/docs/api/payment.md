---
sidebar_position: 5
title: Payment API
---

# Payment API

Base path: `/api/payment`

Handles Razorpay payment processing and verification.

---

## `POST /api/payment/webhook`

Razorpay webhook handler. Called by Razorpay servers on payment events.

**No authentication required** — verified via HMAC-SHA256 signature.

### Headers

```
x-razorpay-signature: <hmac-sha256-hex>
Content-Type: application/json
```

### Body (Razorpay format)

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "order_id": "order_xxx",
        "amount": 2400,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

### Behavior

1. Verifies HMAC-SHA256 signature against `RAZORPAY_WEBHOOK_SECRET`
2. On `payment.captured`:
   - Finds order by `razorpayOrderId`
   - Updates `status: "paid"`, `paymentStatus: "paid"`
   - Stores `razorpayPaymentId`
   - Emits `order:status-updated` socket event
   - Generates and sends invoice (email + WhatsApp)
3. Returns `200 OK` to Razorpay

---

## `POST /api/payment/verify`

Client-side payment verification after Razorpay checkout success callback.

### Auth

Required (`Authorization: Bearer <token>`)

### Request

```json
{
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "abc123...",
  "orderId": "64f..."
}
```

### Response `200`

```json
{
  "success": true,
  "message": "Payment verified",
  "order": {
    "_id": "64f...",
    "status": "paid",
    "paymentStatus": "paid"
  }
}
```

### Verification Logic

```javascript
const expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

if (expectedSignature !== razorpaySignature) {
  throw new Error('Payment verification failed');
}
```

---

## `GET /api/payment/status/:orderId`

Check the payment status of a specific order.

### Auth

Required

### Response `200`

```json
{
  "success": true,
  "orderId": "64f...",
  "status": "paid",
  "paymentStatus": "paid",
  "razorpayOrderId": "order_xxx",
  "totalAmount": 2400
}
```
