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

## Demo Videos

> Watch MediSage in action — from prescription upload to voice-ordered medicine delivery.

| Feature | Video |
|---|---|
| Full System Walkthrough | [![Watch](https://img.shields.io/badge/▶_Full_Demo-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_FULL_DEMO) |
| AI Chat + Multilingual Voice | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_VOICE) |
| Prescription OCR Upload | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_OCR) |
| Pharmacist Agent + Admin Dashboard | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_ADMIN) |
| Structured Output Rendering | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_STRUCT) |
| Autonomous Cron Email Notifications | [![Watch](https://img.shields.io/badge/▶_Watch-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/PLACEHOLDER_NOTIFY) |

---

## What It Does

| Capability | Description |
|---|---|
| **AI Chat Pharmacist** | GPT-4o–powered multi-agent swarm — parent routes intent to specialist child agents (Receptionist, Order Maker) with input/output guardrails |
| **Pharmacist Agent** | Separate clinical-grade AI agent for admins — manages stock, orders, inventory suggestions, and medicine catalog |
| **Prescription OCR** | Upload prescription images; Vision model extracts doctor, medicines, and dosages automatically, stored structured in DB |
| **Order Management** | Full lifecycle — `pending → payment → admin approval → dispatched`, with real-time Socket.IO updates at every step |
| **Inventory Tracking** | Stock add/reduce, low-stock alerts, automated refill reminders, audit log for every change |
| **Multilingual Voice** | English, Hindi, Marathi — transparent translation, TTS Shimmer voice streamed in real time, animated AI avatar |
| **Text-to-Speech** | Streaming TTS via OpenAI `tts-1` — audio chunks sent client as tokens generate, near-zero TTFB |
| **Payment** | Razorpay integration with HMAC-verified webhooks and PDF invoice generation |
| **Admin Dashboard** | Live orders, prescriptions, inventory, refill alerts, and AI reasoning traces — all Socket.IO powered |
| **Session Recording** | Screen recording of chat sessions auto-uploaded to Cloudinary, linked to the prescription for playback |
| **Autonomous Crons** | 8 AM dose reminders + 10 AM refill alerts — zero human input, AI-crafted HTML emails |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Zustand 5, TailwindCSS 4, Framer Motion 12, Socket.IO-client 4 |
| **Backend** | Node.js (ESM), Express 4, MongoDB + Mongoose 8, Socket.IO 4 |
| **AI / Agents** | OpenAI GPT-4o, OpenAI Agents SDK 0.4, Mistral AI, Tavily Search |
| **Storage** | Cloudinary (prescription images + session video recordings) |
| **Caching** | Redis 5 (chat sessions, rate limiting) |
| **Payments** | Razorpay (HMAC-verified webhooks) |
| **Notifications** | Resend (email), Twilio (WhatsApp / SMS), node-cron |
| **Charts** | Recharts 3 |
| **PDF** | jsPDF 4 (invoice generation) |

---

## Project Structure

```
HackFusion-2k26-Team-LUXRAY-/
├── backend/          # Express API, agents, models, socket, scheduler
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
- **[Screen Recording](./features/screen-recording)** — Session recording feature
- **[Multilingual](./features/multilingual)** — Voice and language support
- **[Real-Time Notifications](./features/realtime-notifications)** — Socket.IO event reference
