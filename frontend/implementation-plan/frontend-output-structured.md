
---

**Prompt:**

Upgrade the AI response rendering system so that list-based outputs (such as medicines, orders, prescriptions, inventory results, analytics summaries) are not displayed as raw plain text.

Instead, implement structured, device-aware rendering that transforms list responses into visually optimized UI components.

The goal is to improve UX across desktop and mobile devices without modifying the core agent reasoning logic.

---

# 🧠 Core Principle

The agent should return structured metadata when appropriate.

Frontend must detect structured output types and render them differently.

Do NOT rely only on plain text parsing.

---

# 🎯 Required Output Types to Handle

Implement structured rendering for:

1. Medicine search results
2. Prescription extracted medicine list
3. Order summary
4. Inventory list
5. Refill alerts
6. Payment breakdown
7. Invoice summary
8. Analytics summaries

---

# 🧩 Structured Response Format (Backend Side)

When returning list data, include:

* type (e.g., "medicine_list", "order_summary")
* title
* items (array of objects)
* metadata (optional)

Example conceptual structure:

{
type: "medicine_list",
title: "Available Medicines",
items: [
{ name: "Amlodipine", dosage: "5mg", stock: 20 },
{ name: "Metformin", dosage: "500mg", stock: 15 }
]
}

Do not send raw formatted text only.

Always include structured data.

---

# 📱 Device-Aware Rendering Rules (Frontend)

Detect device width and render accordingly.

---

## 🖥 Desktop View

For list outputs:

* Render as responsive table
* Column headers clearly labeled
* Alternate row shading
* Subtle hover highlight
* Proper spacing
* Sortable columns (optional)

Examples:

* Medicine list → Table
* Orders → Table
* Inventory → Table
* Analytics → Grid + Table

---

## 📱 Mobile View

For list outputs:

* Render as card-based layout
* Each item as a stacked card
* Label-value format
* Proper spacing
* Clear typography hierarchy
* Touch-friendly buttons

Example:

Card:
Medicine: Amlodipine
Dosage: 5mg
Stock: 20

---

# 🎨 UI Design Requirements

Follow premium beige theme:

Light Mode:

* Soft beige background
* Soft borders
* Rounded corners (lg or xl)
* Soft shadows

Dark Mode:

* Warm charcoal background
* Clear contrast
* Subtle blue highlights

Do NOT use:

* Harsh grid lines
* Overly dense tables
* Bootstrap-style heavy borders

---

# 🧠 Smart Rendering Logic

Frontend must:

* Detect response type
* Switch component dynamically
* Fallback to text if type not recognized
* Maintain animation consistency

If agent returns plain text only:
→ Render normally.

If agent returns structured list:
→ Render UI component.

---

# 💬 Chat Integration

Structured outputs should appear as:

AI message bubble
→ followed by structured component

Not inside raw text bubble.

Example:

AI:
“Here are available medicines:”

Then below:
Styled table or cards.

---

# 🧾 Order Summary Rendering

When order created:

Render summary card:

* Order ID
* Items
* Total
* Status
* Payment status

Add visual badges:

Approved → Green
Pending → Yellow
Rejected → Red

---

# 📊 Analytics Rendering

Render:

* KPI cards
* Small charts
* Structured grid layout
* Not text paragraphs

---

# 🔄 Performance Rules

* Do not re-render entire chat
* Use memoized components
* Maintain scroll position

---

# 🧠 Agent Design Constraint

The agent should:

* Return clean structured JSON
* Avoid formatting heavy markdown tables
* Avoid ASCII tables
* Avoid bullet clutter

Formatting must be UI-driven, not LLM-driven.

---

# 🏆 Expected Outcome

Instead of:

“1. Amlodipine 5mg – Stock 20
2. Metformin 500mg – Stock 15”

User sees:

Beautiful table on desktop
Clean stacked cards on mobile

Professional SaaS-level UX.

---

# 🎯 Final Goal

The AI system must feel:

* Structured
* Smart
* Context-aware
* Production-grade
* Not like a chat toy

Structured data → Structured UI.

---
