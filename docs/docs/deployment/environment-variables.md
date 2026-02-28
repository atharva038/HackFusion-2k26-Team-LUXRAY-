---
sidebar_position: 1
title: Environment Variables
---

# Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values.

---

## Backend `.env`

```bash
# ─────────────────────────────────────────
# Server
# ─────────────────────────────────────────
NODE_ENV=development          # "development" or "production"
PORT=5000                     # Backend port

# ─────────────────────────────────────────
# Database
# ─────────────────────────────────────────
MONGODB_URI=mongodb://127.0.0.1:27017/hackfusion-2k26
# Production: mongodb+srv://user:pass@cluster.mongodb.net/dbname

# ─────────────────────────────────────────
# Authentication
# ─────────────────────────────────────────
JWT_SECRET=your_long_random_secret_minimum_32_characters_here
JWT_EXPIRES_IN=7d

# ─────────────────────────────────────────
# Redis
# ─────────────────────────────────────────
REDIS_URL=redis://localhost:6379
# Production: redis://user:pass@host:port

# ─────────────────────────────────────────
# OpenAI
# ─────────────────────────────────────────
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4o
TTS_VOICE=nova               # alloy | echo | fable | onyx | nova | shimmer

# ─────────────────────────────────────────
# Mistral AI (optional fallback)
# ─────────────────────────────────────────
MISTRAL_API_KEY=xxx

# ─────────────────────────────────────────
# Tavily (web search for agents)
# ─────────────────────────────────────────
TAVILY_API_KEY=tvly-xxx

# ─────────────────────────────────────────
# Cloudinary
# ─────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─────────────────────────────────────────
# Razorpay
# ─────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# ─────────────────────────────────────────
# Email (Resend)
# ─────────────────────────────────────────
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@medisage.me

# ─────────────────────────────────────────
# Twilio (WhatsApp)
# ─────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ─────────────────────────────────────────
# Feature Flags
# ─────────────────────────────────────────
ENABLE_SSE_STREAMING=true
ENABLE_AUDIT_LOG=true
```

---

## Frontend `.env`

The frontend uses Vite — all env vars must be prefixed with `VITE_`.

```bash
# Optional: override backend URL (default: same-origin /api)
VITE_API_URL=https://your-backend.onrender.com/api

# Optional: Socket.IO backend URL
VITE_SOCKET_URL=https://your-backend.onrender.com
```

If `VITE_API_URL` is not set, Axios will use the Vite proxy (configured in `vite.config.js`).

---

## Required vs Optional

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | ✓ | |
| `JWT_SECRET` | ✓ | Min 32 chars |
| `OPENAI_API_KEY` | ✓ | Core AI feature |
| `CLOUDINARY_*` | ✓ | Prescription + recording upload |
| `RAZORPAY_*` | ✓ | Payment |
| `RESEND_API_KEY` | Recommended | Email notifications |
| `TWILIO_*` | Optional | WhatsApp notifications |
| `REDIS_URL` | Recommended | Caching + rate limiting |
| `MISTRAL_API_KEY` | Optional | AI fallback |
| `TAVILY_API_KEY` | Optional | Agent web search |
