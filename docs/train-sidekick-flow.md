# **Pilot Sidekick — Onboarding & Training Flow**

## Overview

**Pilot Sidekick** is the AI sales assistant inside the Unified Inbox.
This onboarding flow lives **post-paywall** and exists to:

* Capture sales context, tone, FAQs, and offers.
* Train Sidekick without making the user feel like they’re filling out a form.
* Gate Sidekick behind setup (soft optional: you can skip, but Sidekick stays locked).

---

## **Onboarding Flow**

### **Screen 1: Your Offer Links**

**Purpose**: Capture where Sidekick can pull offer details from.

* Primary Offer Page → \[URL] (mandatory)
* Calendar Link → \[URL] (optional)
* Notion / Website with info → \[URL] (optional)

For optional fields, trigger scraper (Playwright/Firecrawl) to fetch metadata + FAQ-like content.
→ Suggest scraped offers/FAQs as “auto-fill” for the next screens.
→ User can approve or edit.

---

### **Screen 2: Your Offers**

**UI**: Dynamic table. Rows = { Name | Content (short blurb) | Value (\$) }

* Add / remove rows.
* Sidekick uses these for Smart Replies + lead scoring.

---

### **Screen 3: What Do You Sell?**

**Input**: Text area.
Example: “8-week cohort-based course for SaaS founders on monetization”

📌 Stored in `user_offers` for context + AI prompts.

---

### **Screen 4: Set Sidekick’s Tone**

“How should Sidekick sound?”

Options:

* Chill & Friendly
* Confident & Direct
* Like Me (Upload Sample DMs or paste 3 messages)
* Custom (Write your own tone)

🧠 **Implementation Note**:

* Store raw uploads (text, screenshots).
* No embeddings during onboarding → queue **Inngest job** for tone profile generation.
* User sees: “Sidekick is training in the background.”

---

### **Screen 5: FAQs You Get Repeatedly**

“Help Sidekick answer stuff you always get asked.”

Examples:

* “What platform is this on?”
* “Is there a refund?”
* “How many calls?”

- Add More

📌 Stored in `user_faqs` table.
📌 Linked to Sidekick’s auto-reply engine.

---

## **DB Modifications**

### `user_offer`

Stores multiple offers per user.

* `id` (PK)
* `user_id` (FK)
* `name` (text)
* `content` (text)
* `value` (int)
* `created_at`
* `updated_at`

### `user_faq`

Stores FAQs.

* `id` (PK)
* `user_id` (FK)
* `question` (text)
* `answer` (text, nullable until filled)
* `created_at`

### `user_tone_profile`

Placeholder table. Training happens async.

* `id` (PK)
* `user_id` (FK)
* `tone_type` (enum: friendly, direct, like\_me, custom)
* `sample_text` (array of text)
* `sample_files` (stored path/URL if screenshots)
* `trained_embedding_id` (null until processed)
* `created_at`

---

## **Background Jobs (Inngest)**

* **Tone Training Job**: Take uploaded samples → generate embeddings → update `user_tone_profile`.
* **Scraper Job**: Fetch data from Notion/Website → auto-suggest offers + FAQs.
* **Validation Job**: Run sanity checks (at least 1 offer, 1 tone).

---

## **User Experience Rules**

* **Soft optional**: user can skip, but Sidekick panel stays locked with “Complete training to unlock.”
* On finish, Sidekick shows:
  “✅ Training started. Sidekick is learning your tone + FAQs in the background. You’ll be notified when it’s ready.”

---

## **Ideas to Make It Less Boring**

* Use **progressive reveal UI**: gamified steps (progress bar + “2 mins left”).
* For offers: pre-fill with scraped suggestions → let user “approve or edit.”

---

## **Next Steps for Build**

1. Extend DB with 4 new tables: `user_offer`, `user_faq`, `user_tone_profile`.
2. Build 6-step onboarding UI (skip allowed).
3. Hook up Inngest cron/background jobs for:
   * Scraping
   * Tone processing
   * Validation
4. Lock Sidekick panel until onboarding complete.

---

Good — you’ve got a beast of a flow here, but right now it’s one giant “ship it all” monster. That’s a recipe for paralysis. You need **phases** — ruthless sequencing so you can prove value fast, avoid drowning in scope, and buy yourself time to polish the hard parts.

Here’s the cut-down **Phase Plan**:

---

# Phases of Implementation

## **Phase 1: Skeleton Sidekick (MVP Onboarding)**

Goal → Prove people will actually **fill this out** and unlock Sidekick.

* **DB**:
  * Create only `user_offer` and `user_tone_profile`.

* **UI**:
  * Screen 0: Offer links (store raw only, no scraping yet).
  * Screen 1: Offers (manual entry only).
  * Screen 2: “What do you sell?”
  * Screen 3: Tone selection (store raw samples, don’t train yet).
  
* **Jobs**: None. Just save.
* **UX**: Lock Sidekick until onboarding is done.

🚀 Outcome: You’ve got a working post-paywall setup that feels structured, without background magic.

---

## **Phase 2: Enrichment & Background Jobs**

Goal → Add intelligence without slowing onboarding.

* **DB**:
  * Add `user_faq`.

* **UI**:
  * Add Screen 5 (FAQs).

* **Jobs (Inngest)**:
  * Tone training → process embeddings from stored text/screenshots.
  * Validation job (check min requirements).

* **UX**:
  * After onboarding, show “Sidekick is training in background.”
  * Sidekick unlocks with partial abilities while training finishes.

* **UI polish**:
  * Progress bar with “2 mins left.”
  * Smart defaults for FAQs.

🚀 Outcome: You move from dumb input collector → smart Sidekick trainer.

---

## **Phase 3: Auto-Scraping & Smart Suggestions**

Goal → Reduce friction for users, make onboarding magical.

* **DB**: No new tables.
* **UI**:

  * In Offer Links → trigger scraper (Playwright/Firecrawl).
  * Suggest pre-filled offers, FAQs → user approves/edits.
* **Jobs (Inngest)**:

  * Scraper Job.
* **UX**:

  * Feels like the app “already knows” their business → less typing, more trust.

🚀 Outcome: “Holy sh\*t this thing gets me” moment.

---

## **Phase 4: Jobs, Scale & Optimization**

Goal → Prepare for huge data + multi-user demands.

* Add indexing and query optimizations.
* Move embeddings to vector DB (Supabase pgvector / Pinecone).
* Add cron jobs for refreshing tone/FAQ scraping.
* Start training Sidekick to self-update FAQs over time.
* **Jobs (Inngest)**:
  * Tone training → process embeddings from stored text/screenshots.
  * Validation job (check min requirements).

🚀 Outcome: You’ve got a scalable, enterprise-ready Sidekick training flow.