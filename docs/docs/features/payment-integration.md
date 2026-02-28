---
sidebar_position: 6
title: Payment Integration
---

# Payment Integration

MediSage uses **Razorpay** for payment processing with HMAC-SHA256 webhook verification.

---

## Payment Flow

```
1. Agent creates order in DB (status: "pending")
        │
        ▼
2. Razorpay order created server-side
   POST https://api.razorpay.com/v1/orders
   Body: { amount, currency: "INR", receipt: orderId }
   → Returns: razorpayOrderId
        │
        ▼
3. Frontend opens Razorpay Checkout modal
   razorpayOrderId passed to modal
        │
        ▼
4. User completes payment (card/UPI/netbanking)
        │
        ▼
5. Razorpay sends webhook to POST /api/payment/webhook
   Event: payment.captured
   Signature verified (HMAC-SHA256)
        │
        ▼
6. Order updated: status → "paid", paymentStatus → "paid"
   razorpayPaymentId + signature stored
        │
        ▼
7. Socket event → order:status-updated (to user)
8. Invoice generated + sent via email + WhatsApp
```

---

## Webhook Verification

```javascript
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
const signature = req.headers['x-razorpay-signature'];

const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expectedSignature) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

---

## Endpoints

### `POST /api/payment/webhook`
- No authentication required (verified by HMAC signature)
- Handles `payment.captured` event
- Updates order status and triggers notifications

### `POST /api/payment/verify`
- Called by frontend after Razorpay success callback
- Double-check payment on backend
- Body: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }`

### `GET /api/payment/status/:orderId`
- Returns current payment status for an order
- Used to poll/check if payment was completed

---

## Order Fields (payment-related)

```javascript
{
  razorpayOrderId: String,    // From Razorpay order creation
  razorpayPaymentId: String,  // From webhook payment.captured
  razorpaySignature: String,  // For audit
  invoiceId: String,          // Generated on payment
  status: "awaiting_payment" | "paid",
  paymentStatus: "pending" | "paid" | "failed",
  totalAmount: Number,        // In INR (paise for Razorpay)
}
```

---

## Invoice Generation

On successful payment:

1. `invoicePdf.service.js` creates PDF using pdfkit:
   - Order details, items, prices
   - Patient info, prescription reference
   - MediSage branding

2. Email sent via **Resend**:
   ```
   To: user.email
   Subject: Your MediSage Invoice #INV-xxxxx
   Attachment: invoice.pdf
   ```

3. WhatsApp sent via **Twilio**:
   ```
   To: user.phone (WhatsApp number)
   Message: "Your order #xxx has been confirmed. Total: ₹xxx"
   ```

---

## Testing Payments

Use Razorpay test credentials in `.env`:

```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

Test cards:
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`
- UPI: `success@razorpay` (test UPI ID)
