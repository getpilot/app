## 🎯 Overview

**Pilot** is an AI-first CRM that qualifies, tags, and follows up on leads *without* a real-time unified inbox.

Built for creators closing deals in DMs, Pilot acts like an intelligent sales assistant: it listens, learns tone, and executes, freeing up time and mental overhead.

---

## 🧩 Product Vision

**Core Use Cases:**

1. Automatically **classify** leads based on conversational context (e.g., ghosted, hot, nurture).
2. Provide a **CRM dashboard** (table + optional Kanban) to surface prioritized leads.
3. Let users define **AI-driven rules**: “If someone says ‘expensive’ → send X; If ghosted → follow up in 3 days.”
4. **Reply suggestions** that mimic creator voice, context-sensitive and polished.

**Why This Matters:**

* More adaptive than rigid chatbots like ManyChat.
* Less fragile (no platform rate limits/shadow bans).
* Personalized at scale—mirrors user voice + intent.

---

## 📌 Feature Breakdown

1. **AI Lead Triage**
   * NLP-based intent detection and tag updates.
   * Automatic stage progression (ghosted → nurture, hot → notify).

2. **Dashboard UI**
   * Table view: Leads, stage, last message, action status.
   * Kanban view (optional).
   * Deep URL linking: `/leads?id=UUID`.

3. **Rule Engine**
   * “When X → Then Y” workflows.
   * E.g.: “contains ‘expensive’” → auto-reply + tag.

4. **AI Reply Suggestions**
   * Tailored to user tone.
   * Pre-built, honest, closing responses.

5. **Metrics**
   * Lead pipeline analytics.
   * Follower stage drop-offs.
   * Rule performance dashboard.

---

## ⚙️ Tech Stack

### 🖥️ Frontend

* **Next.js 15 (App Router)**
* **TailwindCSS + Radix + shadcn/ui**
* **React 19.1 + react-hook-form**
* **TanStack Query + Axios** (data fetching/mutations)
* **Sonner** for toast notifications
* **Zustand** for client UI state
* **Framer Motion** for onboarding/transitions

### 🧰 Backend & Database

* **Neon DB (serverless Postgres)** — scales cost-effectively, supports branching ([medium.com][1], [chat2db.ai][2], [neon.com][3], [reddit.com][4], [dev.to][5], [konabos.com][6], [reddit.com][7])
* **Drizzle ORM** — type-safe, TS-first database layer ([orm.drizzle.team][8])
* **Better Auth** — modern TypeScript auth for Next.js 15 ([medium.com][1])

### 🤖 AI & Automation

* **Vercel AI SDK (Gemini 2.5‑Flash/Pro)** — for lead classification, reply generation, and tone modeling using Google Gemini via AI SDK 4.x/5 beta; unified interface over best-in-class models ([vercel.com][1])
* **Edge Functions / Server Actions** — trigger tag updates, generate AI reply suggestions, evaluate automation rules
* **Job Queue (Redis)** — schedule follow-ups and run background tasks

### 🔄 Real-Time Updates

* **Server-Sent Events (SSE)** — push lead stage changes, new lead notifications

### ⚒️ Dev Tools & Infrastructure

* **Vercel** — frontend deployment
* **Neon for DB hosting**
* **Redis via managed add-on**
* **GitHub Actions** — CI/CD pipelines

---

## ✅ Why This Stack Works

* **Neon + Drizzle** is a top-tier serverless stack (fast, low-cost, type-safe) ([dev.to][5], [medium.com][1], [reddit.com][4], [chat2db.ai][2], [orm.drizzle.team][8])
* **Better Auth** integrates cleanly with Next.js 15 and Drizzle, streamlining secure identity ([youtube.com][9])
* **TanStack Query + Axios** is non-negotiable: caching, optimistic updates, live syncing
* **SSE > WebSockets**: simpler, stable one-way updates suited to dashboard flow

---

## 🧠 Summary

This stack is **solid, scalable, cost-effective, and developer-friendly**.
You’re combining serverless DB, modern auth, type-safe ORM, and AI-driven business logic.
Build small, validate fast, and scale only what users need.

---

Want me to turn this into a wireframe spec or user flow next?

[1]: https://medium.com/%40abgkcode/building-a-full-stack-application-with-next-js-drizzle-orm-neon-postgresql-and-better-auth-6d7541fba48a "Building a Full-Stack Application with Next.js, Drizzle ORM, Neon ..."
[2]: https://chat2db.ai/resources/blog/neon-vs-supabase "Neon vs Supabase: A Comprehensive Comparison and Analysis ..."
[3]: https://neon.com/blog/nextjs-authentication-using-clerk-drizzle-orm-and-neon "Next.js authentication using Clerk, Drizzle ORM, and Neon"
[4]: https://www.reddit.com/r/nextjs/comments/1kdos8c/drizzle_orm_neon_db_and_next_js/ "Drizzle Orm Neon Db and Next js : r/nextjs - Reddit"
[5]: https://dev.to/miljancode/drizzle-orm-nextauth-and-supabase-2dp "Drizzle ORM, NextAuth and Supabase - DEV Community"
[6]: https://konabos.com/blog/building-a-full-stack-app-with-next-js-trpc-drizzle-orm-neon-database "Building a Full-Stack App with Next.js, tRPC, Drizzle ORM & Neon ..."
[7]: https://www.reddit.com/r/nextjs/comments/1jxs74m/nextjs_neon_db_drizzle_better_auth/ "Nextjs + Neon db + Drizzle + Better auth - Reddit"
[8]: https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon "Todo App with Neon Postgres - Drizzle ORM"
[9]: https://www.youtube.com/watch?v=D2f_gN1uZbc&utm_source=chatgpt.com "Nextjs 15 Authentication Made EASY with Better Auth - YouTube"