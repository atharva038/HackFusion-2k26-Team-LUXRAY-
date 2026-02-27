# Hackathon Features Plan

## 🚀 Features to Add
- **Multilingual Chat and Voice Support**: Support for regional languages like Marathi and Hindi using specialized TTS/STT pipelines and translation APIs.
- **WhatsApp/Telegram Bot Integration**: Make the AI pharmacy assistant universally accessible by extending the interface to work natively on WhatsApp or Telegram via Twilio/Meta webhooks.
- **Prescription OCR & Auto-Processing**: Allow users to upload a photo of a handwritten prescription. Use OCR (Google Vision / Tesseract) paired with the LLM to automatically extract medications, dosages, and verify against inventory.
- **Proactive AI Refill Predictions**: Instead of simple countdowns, use an AI model to predict when a patient is likely running low based on historical adherence and order frequency, sending proactive SMS/WhatsApp alerts.
- **Drug-Drug Interaction Checker**: Integrate a new agent tool that connects to an external medical database (e.g., RxNorm, FDA API) to warn users and pharmacists if a newly requested medicine conflicts with their active prescriptions.
- **Symptom Triage Agent**: A specialized sub-agent that can suggest over-the-counter (OTC) remedies for minor ailments while explicitly routing severe cases to a human doctor.m?
- **Real-Time Admin Dashboard (WebSockets)**: Upgrade the current dashboard to use Socket.io. Instead of page reloads, pharmacists should see live, instant updates when a new order is placed, inventory runs low, or a prescription needs manual review.
- **Streaming AI Responses (SSE)**: Implement Server-Sent Events for the AI text generator so the user sees the message typing out instantly, significantly reducing perceived latency compared to waiting for the full generation block.
- **Faster Voice Processing & VAD**: Add Voice Activity Detection (VAD) on the frontend so the microphone automatically stops recording when the patient stops speaking, creating a seamless walkie-talkie-like experience.
- **Redis Caching Layer**: Implement a cache for frequent backend tool calls (like warehouse and inventory checks) to drastically cut down database reads and make the agent's decision loops blazingly fast.
- **Granular Agent Tracing System**: Improve the audit logs so the pharmacist (or hackathon judges) can open a gorgeous UI timeline showing *exactly* how the AI "thought" (e.g., "Checked Inventory" -> "Failed" -> "Checked Warehouse" -> "Success").
