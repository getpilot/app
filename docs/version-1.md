## 🚀 Pilot V1 Feature Document

### ✅ 1. Core Features

#### 🔐 Auth

* Sign-up and login via **email/password** using Better Auth
* Persist user auth state securely with JWTs
* Protect all pages—only authenticated users access app

#### 🧭 Onboarding

* Single-page, multi-step onboarding:
  1. Use-case & platform selection
  2. Goals & tracking methods
* Persist responses in `user` table (via Drizzle ORM)
* Only after completion should users access the app

#### 💵 Pricing

* Display tier (Solo, Pro, etc.) after onboarding
* Show current plan & billing options in settings (no payments system yet)

#### 🧩 Dashboard

* Layout built with **shadcn/ui** sidebar
* Sidebar items:
  * Dashboard (Home)
  * Automations
  * Settings
* Apply responsive design; desktop-first layout

---

### 📲 2. App Functionality

#### 🔗 Instagram Login

* Connect IG Business via OAuth
* Store IG access token
* Setup basic polling (or eventual webhook) of user DMs and comments

#### 📋 Contacts Table View

* Display IG contacts and active threads in a table
* Columns: Name, Last Message, Tags, Score
* UI interactions: sort, search, pagination (limit 50 per page)
* Kanban view planned later

---

### 🤖 3. Automations (ManyChat-style)

#### 📢 Trigger: Keywords

* **On comment**: match specific keyword(s) on configured post(s)
* **On DM**: match specific inbound DM keywords

#### 💬 Actions

* **Send DM**: pre-defined text
* **AI takeover**: use AI model with custom system prompt

#### ⏱ Scheduled Automations

* Auto-tag thread **every 12 hours** (e.g. “nurture”, “cold”)
* If a thread is **ghosted** (no reply for 48 hours), trigger follow-up

#### 📊 Analytics

* Track number of automations sent per thread, conversions
* Display simple charts (count of triggers, tags applied)

#### 🧮 Lead Scoring

* Score each contact (0–100) based on:
  * Keywords
  * Agent activity
  * Replies received
* Show score in Contacts table

---

### ⚙️ 4. Tech Stack & Infrastructure

#### 🖥️ Frontend

* **Next.js 15** with App Router
* **TailwindCSS** + **Radix UI** + **shadcn/ui**
* **React 19**, **react-hook-form** for forms
* **Zod** for input validation
* **TanStack Query** + **Axios** for data fetching
* **Sonner** for notifications

#### 🗄️ Backend

* **Neon DB** (serverless Postgres)
* **Drizzle ORM** (type-safe DB layer)
* **Better Auth** (Next.js integration)
* **Instagram OAuth** + token storage + basic polling logic
* **Edge Functions / Server Actions** for automation triggers

#### 🤖 AI Layer

* **Vercel AI SDK (Gemini)** for message classification, AI-generated replies
* Custom system prompts for "AI takeover"

<!-- #### 🗓️ Background Processing

* **Redis + BullMQ** for scheduling recurring automations (tags, ghost follow-ups) -->

#### 🔄 Real-Time

* **SSE** endpoint to push live tag and automation updates to dashboard

#### 🛠 Tools

* **Vercel** for frontend deploy
* **Neon** for DB hosting
<!-- * **Redis on Ghost** -->
* **GitHub Actions** for CI/CD

---

### 🧭 5. Milestones

| Phase     | Features                                                           |
| --------- | ------------------------------------------------------------------ |
| MVP Start | Auth, onboarding, sidebar, IG connection, Contacts table + scoring |
| Phase 1   | Keyword triggers (comment + DM), send DM, AI takeover              |
| Phase 2   | Tag scheduling, ghost follow-up, analytics                         |
| Phase 3   | Background queue, live updates via SSE                             |
| Phase 4   | UI polish, performance tuning, automation dashboard                |

---

### 🎯 Outcome

Pilot V1 empowers creators with:

* Seamless IG login and contact tracking
* Intelligent inbox prep through lead scoring
* Real-time automations (keyword-based triggers, AI replies)
* Automated nurturing workflows
* Actionable insights via live analytics

This sets a strong foundation for future growth (multi-platform, kanban, CRM view) with speed and focus.