---
sidebar_position: 1
title: Database Models
---

# Database Models

MediSage uses **MongoDB** via **Mongoose**. All models use `timestamps: true` unless noted.

---

## User

**Collection:** `users`

```javascript
{
  _id: ObjectId,
  name: String,           // required, trim
  email: String,          // required, unique, lowercase, trim
  password: String,       // required, 6+ chars, select: false (never returned)
  phone: String,
  role: String,           // enum: ["customer", "admin", "pharmacist"], default: "customer"
  age: Number,            // 0–150
  gender: String,         // enum: ["male", "female", "other"]
  allergies: [{
    allergen: String,     // required, lowercase (e.g. "penicillin")
    severity: String,     // enum: ["low", "medium", "high", "critical"], default: "medium"
    reaction: String,     // e.g. "anaphylaxis"
  }],
  createdAt: Date,
  updatedAt: Date,
}
```

Indexes: `email` (unique)

---

## Medicine

**Collection:** `medicines`

```javascript
{
  _id: ObjectId,
  name: String,                 // required, indexed
  pzn: String,                  // required, unique, indexed (Pharmacy product number)
  price: Number,                // required, min: 0
  description: String,          // default: ""
  unitType: String,             // enum: ["tablet","strip","bottle","injection","tube","box","capsule"]
  stock: Number,                // required, min: 0
  prescriptionRequired: Boolean,// default: false
  lowStockThreshold: Number,    // default: 10
  createdAt: Date,
  updatedAt: Date,
}
```

---

## Order

**Collection:** `orders`

```javascript
{
  _id: ObjectId,
  user: ObjectId,                // ref: User, required, indexed
  age: Number,
  gender: String,                // enum: ["male", "female", "other"]
  purchasingDate: Date,          // default: now
  prescription: Boolean,         // true if Rx order
  prescriptionProof: String,     // Cloudinary URL
  items: [{
    medicine: ObjectId,          // ref: Medicine, required
    dosage: String,
    quantity: Number,            // required
  }],
  status: String,                // enum: ["pending","awaiting_payment","paid","approved",
                                 //        "rejected","awaiting_prescription","dispatched"]
                                 // default: "pending"
  paymentStatus: String,         // enum: ["pending","paid","failed"], default: "pending"
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  invoiceId: String,
  totalItems: Number,
  totalAmount: Number,
  rejectionReason: String,
  approvedBy: ObjectId,          // ref: User
  createdAt: Date,
  updatedAt: Date,
}
```

---

## Prescription

**Collection:** `prescriptions`

```javascript
{
  _id: ObjectId,
  user: ObjectId,                // ref: User
  prescriptions: [{
    imageUrl: String,            // required — Cloudinary URL
    extractedData: [{
      name: String,
      doctor_name: String,       // required
      hospital_name: String,     // required
      user_name: String,         // required
      medi_name: String,         // required — medicine name
      dosage: String,
      frequency: String,
      total_quantity: Number,
      duration_days: Number,
      instructions: String,
    }],
    uploadedAt: Date,            // default: now
    startDate: Date,             // default: now
    isActive: Boolean,           // default: true
  }],
  medicine: ObjectId,            // ref: Medicine
  validUntil: Date,
  approved: Boolean,             // default: false
  sessionVideoUrl: String,       // Cloudinary video URL (null if no recording)
  sessionRecordingOrderId: ObjectId, // ref: Order
  createdAt: Date,
  updatedAt: Date,
}
```

---

## ChatSession

**Collection:** `chatsessions`

```javascript
{
  _id: ObjectId,
  user: ObjectId,                // ref: User, required, indexed
  title: String,                 // default: "New Chat"
  messages: [{
    role: String,                // enum: ["user", "ai"], required
    content: String,             // required
  }],
  agentType: String,             // enum: ["customer", "pharmacist"], indexed
                                 // default: "customer"
  createdAt: Date,
  updatedAt: Date,
}
```

---

## RefillAlert

**Collection:** `refillalerts`

```javascript
{
  _id: ObjectId,
  user: ObjectId,                    // ref: User
  medicine: ObjectId,                // ref: Medicine
  lastOrderDate: Date,
  estimatedDepletionDate: Date,      // Calculated: lastOrderDate + duration_days
  status: String,                    // enum: ["active","notified","completed"]
                                     // default: "active"
  createdAt: Date,
  updatedAt: Date,
}
```

---

## InventoryLog

**Collection:** `inventorylogs`

```javascript
{
  _id: ObjectId,
  medicine: ObjectId,     // ref: Medicine, required
  changeType: String,     // enum: ["deduct", "restock"], required
  quantity: Number,       // required (positive, absolute value)
  order: ObjectId,        // ref: Order (null for manual restocks)
  createdAt: Date,
  updatedAt: Date,
}
```

---

## AgentAuditLog

**Collection:** `agentauditlogs`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User, required, indexed
  sessionId: String,          // indexed
  userMessage: String,        // required, max: 2000 chars
  agentResponse: String,      // max: 5000 chars
  agentChain: [String],       // e.g. ["ChatParent", "OrderChild"]
  toolsUsed: [String],        // e.g. ["checkStock", "createOrder"]
  durationMs: Number,         // total execution wall-clock time
  status: String,             // enum: ["success", "error", "blocked"]
                              // default: "success"
  errorMessage: String,
  injectionDetected: Boolean, // default: false
  model: String,              // default: "gpt-4o"
  inputTokens: Number,
  outputTokens: Number,
  traces: [{
    agent: String,            // Agent name
    action: String,           // e.g. "invoke_tool", "respond", "blocked"
    data: Mixed,              // Tool input/output or response content
  }],
  createdAt: Date,
  updatedAt: Date,
}
```

Indexes:
- `{ userId: 1, createdAt: -1 }` — compound
- `{ sessionId: 1 }`

---

## MongoDB Connection

`backend/src/config/db.js`

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

Default URI: `mongodb://127.0.0.1:27017/hackfusion-2k26`
