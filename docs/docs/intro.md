---
sidebar_position: 1
slug: /intro
title: Introduction
---

# MediSage — AI Pharmacy System

**MediSage** is a full-stack, AI-powered pharmacy platform built for **HackFusion 2k26** by **Team LUXRAY**. It replaces the traditional pharmacy counter with an autonomous AI pharmacist that understands natural language, processes prescriptions, manages inventory, and orchestrates real-time orders — all through a conversational chat interface.

**Live:** [medisage.me](https://medisage.me)
**Repository:** [github.com/atharva038/HackFusion-2k26-Team-LUXRAY-](https://github.com/atharva038/HackFusion-2k26-Team-LUXRAY-)

---

## What It Does

| Capability | Description |
|---|---|
| **AI Chat Pharmacist** | GPT-4o–powered agent answers medicine queries, checks interactions, places orders |
| **Prescription OCR** | Upload prescription images; AI extracts doctor, medicines, dosages automatically |
| **Order Management** | Full lifecycle — pending → payment → admin approval → dispatch, with real-time socket updates |
| **Inventory Tracking** | Stock management, low-stock alerts, automated refill reminders |
| **Multilingual** | English, Hindi, Marathi — transparent translation before/after AI processing |
| **Text-to-Speech** | Streaming TTS for voice-first interaction |
| **Payment** | Razorpay integration with HMAC-verified webhooks |
| **Admin Dashboard** | Orders, prescriptions, inventory, refill alerts, AI reasoning traces |
| **Session Recording** | Screen recording of chat sessions stored to Cloudinary |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Zustand, TailwindCSS, Framer Motion, Socket.IO-client |
| **Backend** | Node.js (ESM), Express, MongoDB/Mongoose, Socket.IO, Redis |
| **AI** | OpenAI GPT-4o, OpenAI Agents SDK, Mistral AI, Tavily |
| **Storage** | Cloudinary (images + video), MongoDB |
| **Payments** | Razorpay |
| **Notifications** | Resend (email), Twilio (WhatsApp) |
| **Scheduling** | node-cron |
| **Caching** | Redis |

---

## Project Structure

```
HackFusion-2k26-Team-LUXRAY-/
├── backend/          # Express API, agents, models, socket
├── frontend/         # React SPA
└── docs/             # This documentation site (Docusaurus)
```

---

## Quick Navigation

- **[Architecture Overview](./architecture/overview)** — How all the pieces fit together
- **[AI Pharmacist](./features/ai-pharmacist)** — Multi-agent orchestration deep dive
- **[API Reference](./api/authentication)** — All REST endpoints
- **[Database Models](./database/models)** — MongoDB schema reference
- **[Getting Started](./development/getting-started)** — Run locally in minutes
