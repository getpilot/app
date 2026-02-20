# Human Response Needed (HRN) – Progress Overview

Branch: `feat/hrn-human-response-needed-status`

This doc captures everything about HRN in the codebase: why it exists, how it works, what’s shipped, and what’s planned.

---

## 1) Concept & Goals

- HRN (Human Response Needed) = **pause bot replies and route this thread to a human**.
- HRN is **orthogonal** to lead temperature (hot/warm/cold/neutral/ghosted) and stage (new/lead/follow-up/ghosted).
- Goal: let Sidekick handle routine DMs while never auto-answering risky or high-touch messages (refunds, legal, contracts, pricing changes, custom deals, VIPs, etc.).

Design intents:
- **Safety:** avoid auto-responding to sensitive topics.
- **Control:** let users force HRN for specific triggers (e.g., “refund” automation).
- **Visibility:** make HRN threads obvious and easy to triage (queue-style UX).
- **Low friction:** only HRN when risk signals exist; stay auto for routine.

---

## 2) Detection & Guardrails

Implementation: `src/lib/sidekick/hrn.ts`

- **LLM classifier (Gemini via Vercel AI SDK):**
  - Outputs JSON: `{ hrn: boolean, confidence: number, signals: string[], reason: string }`.
  - Prompt includes examples for doc review, pricing negotiation, refunds, trivial messages.

- **Guardrails (pre-LLM heuristics):**
  - **Risk terms force HRN:** refund, cancel, chargeback, legal, lawyer, terms, pricing, discount, custom, scope, deadline.
  - **Doc + review verbs force HRN:** doc/link terms (pdf, doc, contract, proposal, deck, slides, notion, loom, drive, invoice, quote, estimate, etc.) + review verbs (review, check, sign, approve, confirm, verify, look over, feedback, thoughts).
  - **Trivial acks bias AUTO_OK:** very short “ok/thanks/👍” with no risky terms.
  - If none of the above, call the LLM for nuanced classification.
  - **Parse-failure safety:** if the LLM returns malformed JSON, the classifier defaults to HRN (not AUTO_OK).

- **Automation-level HRN enforcement:**
  - Field `hrn_enforced` on automations; creation UI has “Pause bot and route to human when triggered”.
  - When a DM matches an HRN-enforced automation, we immediately HRN the thread and skip auto-replies.

---

## 3) Data Model & Migrations

Schema: `src/lib/db/schema.ts`

- **Contact fields:**
  - `requires_human_response` (boolean)
  - `human_response_set_at` (timestamp)
  - `last_auto_classification` (`auto_ok` | `hrn`)
- **Automation field:**
  - `hrn_enforced` (boolean)

Migrations:
- `0024_lucky_grandmaster.sql` → contact HRN flags.
- `0025_hrn_last_classification.sql` → last auto classification.
- `0026_hop_hrn_enforced.sql` → automation HRN enforcement.

---

## 4) Runtime Behavior (Webhook)

Implementation: `src/app/api/webhooks/instagram/route.ts`

- **Helper:** `upsertContactState`
  - Inputs: contactId, userId, messageText, stage, sentiment, leadScore, requiresHRN, optional humanResponseSetAt, lastAutoClassification.
  - Upserts contact with last message/time, stage, sentiment, leadScore, HRN flags/timestamp, lastAutoClassification.

- **DM flow:**
  1) Ignore echo/self; ensure integration exists.
  2) Load existing contact (if any).
  3) Run guardrails + LLM classifier.
  4) If contact is already HRN: update message fields, keep HRN, skip reply.
  5) If classifier says HRN: mark HRN (set timestamp/classification), skip reply.
  6) Idempotency window to avoid double send.
  7) Check automations:
     - If matched automation has `hrnEnforced`, mark HRN and skip reply.
     - Else run automation (fixed/AI/generic template).
  8) If no automation, fallback to Sidekick `generateReply` and mark AUTO_OK.
  9) Log to `sidekick_action_log`; log automation usage when applicable.

- **Comments flow:**
  - Uses automations/generic templates; HRN logic is focused on DMs for now.

---

## 5) UI & UX

Contacts:
- **Table:** HRN column (badge vs “Auto”) + HRN-only filter. (`src/components/contacts/contacts-table.tsx`)
- **Row actions:** “Mark HRN (pause bot)” / “Back to auto”. (`src/components/contacts/row-actions.tsx`)
- **Detail banner:** Shows HRN state, set time, last classification; buttons to keep or clear HRN. (`src/components/contacts/expanded-contact-row.tsx`)
- **Contact actions hook:** Adds `handleHRNStateChange` with toasts. (`src/hooks/use-contact-actions.ts`)

Sidekick page:
- **HRN queue:** Lists paused threads (avatar, name, stage, sentiment, score, HRN set time, last message, last classification) with “Mark handled”. Scrollable. (`src/components/sidekick/hrn-list.tsx`)
- **Follow-up list:** Existing follow-up queue, now scrollable. (`src/components/sidekick/follow-up-list.tsx`)
- **Layout:** Renders Sidekick panel + both queues. (`src/app/(dashboard)/(workspace)/page.tsx`, `src/components/sidekick/layout.tsx`)

Automations UI:
- Creation form includes HRN toggle (“Pause bot and route to human when triggered”). (`src/app/(dashboard)/(workspace)/automations/new/page.tsx`)

README:
- Contact Management bullet mentions HRN flags/filter.

---

## 6) Server Actions

Contacts (`src/actions/contacts.ts`):
- `fetchInstagramContacts` returns HRN fields.
- `fetchFollowUpContacts` returns HRN fields.
- `fetchHRNContacts` returns only HRN contacts (ordered by HRN set time).
- `updateContactHRNState` sets HRN flag/timestamp and `lastAutoClassification`.

Automations (`src/actions/automations.ts`):
- Types include `hrnEnforced`.
- `createAutomation` and `updateAutomation` accept/store `hrnEnforced`.
- `getActiveAutomations` returns `hrnEnforced`.

---

## 7) Status: Done vs Planned

Done:
- Guardrails + LLM classifier (structured JSON).
- Contact HRN fields; automation HRN enforcement.
- Webhook HRN lockout, respects HRN-enforced automations.
- UI: HRN badge/filter, banner, queue; automation HRN toggle; scrollable queues.
- README references HRN in Contact Management.

Planned / Not shipped yet:
1) **Admin controls:** global HRN toggle; sensitivity presets; per-playbook overrides (never/always HRN beyond current `hrn_enforced`).
2) **Notifications/SLAs:** in-app/email/push on HRN creation; SLA timers; metrics (TTFHR, HRN vs non-HRN win-rate).
3) **Classifier logging/feedback:** persist `signals/reason/confidence`; show “Why HRN?”; feedback buttons (“should/should not be HRN”) for tuning.
4) **Thread-level HRN (optional):** move HRN flags to a conversation/thread entity keyed by IG thread ID; contact becomes a roll-up.
5) **HRN + score prioritization:** filters/sorting for HRN with lead score/value to prioritize work.

---

## 9) Checklist (✅ done / ☐ pending)

- ✅ Guardrails (risk terms, doc+review, trivial acks) in classifier
- ✅ LLM classifier for HRN vs AUTO_OK
- ✅ Contact HRN fields (`requires_human_response`, `human_response_set_at`, `last_auto_classification`)
- ✅ Automation HRN enforcement flag (`hrn_enforced`)
- ✅ Migrations: `0024_lucky_grandmaster.sql`, `0025_numerous_nemesis.sql`, `0026_bitter_lizard.sql`
- ✅ Webhook HRN lockout (DM) + respects HRN-enforced automations
- ✅ HRN column/filter in Contacts table
- ✅ HRN banner + controls in contact detail
- ✅ HRN queue in Sidekick; scrollable follow-up/HRN lists
- ✅ Row actions / contact actions for HRN state change
- ✅ Automation creation form HRN toggle
- ✅ README mention of HRN in Contact Management

- ☐ Admin controls (enable/disable HRN; sensitivity presets; per-playbook overrides beyond `hrn_enforced`)
- ☐ HRN + lead-score/value prioritization filters/sorts

---

## 8) Quick File Map

- Classifier & guardrails: `src/lib/sidekick/hrn.ts`
- Webhook: `src/app/api/webhooks/instagram/route.ts`
- DB schema: `src/lib/db/schema.ts`
- Migrations: `drizzle/migrations/0024_lucky_grandmaster.sql`, `0025_numerous_nemesis.sql`, `0026_bitter_lizard.sql`
- Contacts actions: `src/actions/contacts.ts`
- Automations actions: `src/actions/automations.ts`
- Contacts UI: `src/components/contacts/contacts-table.tsx`, `expanded-contact-row.tsx`, `row-actions.tsx`
- Sidekick UI: `src/components/sidekick/hrn-list.tsx`, `sidekick/follow-up-list.tsx`, `components/sidekick/layout.tsx`, `app/(dashboard)/(workspace)/page.tsx`
- Hooks: `src/hooks/use-contact-actions.ts`
- Automations UI: `src/app/(dashboard)/(workspace)/automations/new/page.tsx`
