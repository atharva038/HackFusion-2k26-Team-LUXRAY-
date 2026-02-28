# 🚀 Next-Gen Autonomous Pharmacy Assistant 
**HackFusion 2k26 · Team LUXRAY**

> [!TIP]
> **Pitch Strategy** 
> When presenting, focus on the *complexity* we abstracted away. We didn't just build a chatbot; we built an **orchestrated multi-agent swarm** that handles the complete lifecycle of a patient—from uploading a handwritten prescription to receiving voice-guided doses and automated refill emails.

---

## 🧠 1. Multi-Agent AI Swarm Architecture
*The core brain of the platform. We moved beyond "single-prompt" bots to a specialized, routing-based micro-agent architecture using the OpenAI Agents SDK.*

#### The Routing Model (Parent-Child Paradigm)
- **Parent Director Agent**: Detects user intent seamlessly bridging casual health chat with actionable commands.
- **Pharmacist Agent**: Specializes in checking drug interactions, alternative medicines, and managing the hospital/pharmacy's inventory.
- **Patient Care Agent**: Parses uploaded prescriptions natively using Vision models and structures the medical data directly into the DB.
- **Order & Notification Agents**: Autonomous sub-agents that handle purchases, dose schedules, and daily refill alerts.

#### ⚡ Key Hackathon Flex
> *“Our system knows when to stop chatting and when to trigger a tool. If the user says 'I want to reorder my meds,' the Parent Agent routes this directly to the Order Agent, which queries the database, verifies active prescriptions, and executes the transaction without a single hard-coded frontend button click.”*

---

## 🗣️ 2. True Multimodal & Multilingual Voice UX
*Making healthcare accessible to everyone, regardless of language or tech-literacy.*

- **Real-Time Text-to-Speech (TTS)**: Integrated OpenAI's `tts-1` model with the highly realistic "Shimmer" voice.
- **Audio Streaming**: We stream the audio chunks directly to the client as the AI generates text, dropping the Time-To-First-Byte (TTFB) significantly so the system feels alive.
- **Multilingual Support**: Natively understands and speaks local languages (Marathi, Hindi, etc.) without requiring users to manually change language settings. Just speak in Hindi, and the AI replies in Hindi audio.
- **Responsive AI Avatar**: A custom, animatable SVG avatar that visually reacts (pulsing, speaking rings) based on the AI's current state (listening, processing, speaking).

---

## 📊 3. Dynamic Structured Output Rendering
*Text walls are dead. We built a frontend interceptor that converts AI JSON outputs into beautiful React components on the fly.*

- **Smart Interceptor**: The frontend parses the AI's raw text stream, identifies structured data (`medicine lists`, `order summaries`), and instantly swaps the text block for a rich UI component.
- **Device-Aware Rendering**:
  - **Desktop**: Renders sortable, wide-view `DataTables` with status badges.
  - **Mobile**: Automatically converts the same data into stacking [DataCards](file:///Users/atharva_beast/Desktop/Coading/Hackfusion-2k26/frontend/src/components/chat/DataCards.jsx#26-79) using Framer Motion animations to save screen real estate.
- **Rich Order Cards**: When an order is placed, the UI renders a beautiful summary card with payment totals, patient IDs, and order status.

---

## ⏰ 4. Autonomous Notification & Inventory Engine
*A zero-touch system that runs in the background to keep patients healthy and pharmacies stocked.*

- **The Daily Crons**:
  - **8:00 AM Dose Reminders**: An AI agent queries the DB for active medicines, figures out who needs to take what today, and crafts a customized green-themed HTML email with specific dosage instructions.
  - **10:00 AM Refill Alerts**: The AI scans all prescriptions in the system, calculates expiration dates mathematically, and automatically emails patients who have exactly 1 or 2 days left on their meds (red-themed urgent HTML emails).
- **Proactive Admin Alerts**: The system constantly monitors pharmacy stock. If Paracetamol drops below the threshold, an AI agent drafts an urgent low-stock HTML table and emails all registered Pharmacists/Admins immediately.

---

## 🔐 5. Production-Ready Security & Backend
*Built to scale, not just to demo.*

- **Rate Limiting via Redis**: Built custom Redis-backed rate limiters to prevent API abuse on the expensive TTS and Chat endpoints, falling back gracefully if Redis drops.
- **Robust Role-Based Access Control (RBAC)**: JWT authentication separating [User](file:///Users/atharva_beast/Desktop/Coading/Hackfusion-2k26/frontend/src/services/api.js#36-39) controls from `Admin/Pharmacist` controls. Only an Admin can hit the inventory or test-mail endpoints.
- **Error Handling & Fallbacks**: If the AI schema fails or the user provides an empty medicine name, the code catches it deterministically before executing the email pipeline.

---

## 💡 How to present this sequentially (The Flow)

1. **The Problem:** "Managing prescriptions and buying medicine is tedious, especially for the elderly. We built Team LUXRAY's Assistant to automate everything."
2. **The Demo (Voice + Vision):** 
   - Upload a prescription. Show the Vision model parsing it.
   - Speak in Hindi/Marathi to the mic: *"Mera prescription order kardo"*.
   - Let the audience hear the responsive AI voice and watch the UI generate a beautiful Order Card (Structured Output).
3. **The Magic (Behind the scenes):** Show them the Architecture diagram. Explain the Swarm (Parent routing to Order agent).
4. **The Automation (Real-world impact):** "But what happens after they order? They forget to take it. We built an autonomous background Cron system." Show them the beautiful HTML Dose Reminder and Refill emails that require zero human input.
5. **The Admin Side:** Mention that while the patient gets cared for, the Admin gets an automated Low-Stock alert generated by an AI summarizer.

---
**Status:** Everything is live, tested, and secure. We are ready for the next feature. 🚀
