---
sidebar_position: 2
title: Tech Stack
---

# Tech Stack

Complete list of all libraries and services used in MediSage.

---

## Backend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.21.2 | Web framework |
| `mongoose` | ^8.10.1 | MongoDB ODM |
| `socket.io` | ^4.8.3 | Real-time WebSocket server |
| `redis` | ^5.11.0 | Session caching + rate limiting |
| `@openai/agents` | ^0.4.15 | OpenAI Agents SDK (multi-agent orchestration) |
| `openai` | ^6.24.0 | OpenAI API (chat, TTS) |
| `@mistralai/mistralai` | ^1.14.0 | Mistral AI (fallback AI) |
| `@tavily/core` | ^0.7.1 | Web search tool for agents |
| `cloudinary` | ^2.9.0 | Image & video hosting |
| `multer` | ^2.0.2 | Multipart file upload |
| `razorpay` | ^2.9.6 | Payment gateway |
| `nodemailer` | ^8.0.1 | Email sending |
| `twilio` | ^5.12.2 | WhatsApp notifications |
| `node-cron` | ^3.0.3 | Scheduled jobs |
| `pdfkit` | ^0.17.2 | PDF invoice generation |
| `xlsx` | ^0.18.5 | Excel export |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT tokens |
| `zod` | ^4.3.6 | Input validation schemas |
| `fuse.js` | ^7.1.0 | Fuzzy medicine search |
| `cors` | ^2.8.5 | CORS headers |
| `morgan` | ^1.10.0 | HTTP request logging |
| `dotenv` | ^16.4.7 | Environment variables |
| `express-rate-limit` | latest | IP-based rate limiting |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `nodemon` | Auto-restart on file changes |
| `vitest` | Unit testing framework |

---

## Frontend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.0 | UI library |
| `react-dom` | ^19.2.0 | DOM rendering |
| `react-router-dom` | ^7.13.1 | Client-side routing |
| `zustand` | ^5.0.11 | Lightweight state management |
| `axios` | ^1.13.5 | HTTP client with interceptors |
| `socket.io-client` | ^4.8.3 | WebSocket client |
| `react-markdown` | ^10.1.0 | Markdown rendering for AI responses |
| `tailwindcss` | ^4.2.1 | Utility-first CSS framework |
| `framer-motion` | ^12.34.3 | Animation library |
| `lucide-react` | ^0.575.0 | Icon library |
| `recharts` | ^3.7.0 | Charts for admin dashboard |
| `react-hot-toast` | ^2.6.0 | Toast notifications |
| `clsx` | ^2.1.1 | Conditional class names |
| `jspdf` | ^4.2.0 | Client-side PDF generation |
| `vite` | ^7.3.1 | Build tool + dev server |

---

## External Services

| Service | Purpose | Configuration |
|---|---|---|
| **OpenAI** | GPT-4o (chat), TTS (audio) | `OPENAI_API_KEY`, `OPENAI_MODEL`, `TTS_VOICE` |
| **Mistral AI** | Alternative AI model | `MISTRAL_API_KEY` |
| **Tavily** | Web search for agents | `TAVILY_API_KEY` |
| **MongoDB Atlas** | Database (production) | `MONGODB_URI` |
| **Redis Cloud** | Caching + rate limits | `REDIS_URL` |
| **Cloudinary** | Image + video storage | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Razorpay** | Payment processing | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| **Resend** | Transactional email | `RESEND_API_KEY`, `FROM_EMAIL` |
| **Twilio** | WhatsApp notifications | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` |

---

## Infrastructure

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | DigitalOcean App Platform / Render |
| Domain | medisage.me |
| Database | MongoDB Atlas |
| Cache | Redis Cloud |
| Media | Cloudinary |
