# Pilot Sidekick – plan for automated messaging (IG-first)

## goal
- ship a minimal but real "automated messaging" loop for instagram dms that can later expand to fb and x.
- keep it simple: detect a new inbound dm → generate a reply (or use a template) → send → log the action.

## what we already have (from current branch)
- instagram oauth + integration stored: `instagram_integration` with `instagram_user_id`, `username`, `access_token`, `expires_at`.
- webhooks wired: `/api/webhooks/instagram` receiving dm events.
- axios-based sender: `sendInstagramMessage(igUserId, recipientId, accessToken, text)`.
- db + contacts sync scaffolding and analytics hooks exist in `src/actions/contacts.ts`.

## scope for this iteration (v1)
- instagram only, dm events only.
- auto mode only (no drafts for now).
- lead score, stage, and sentiment classification done directly in db via existing `contacts` table.
- ai-generated replies with last 10 messages as context.
- user-editable system prompt for sidekick personality.

## success criteria
- on each inbound dm, sidekick generates and auto-sends a reply if confidence ≥ threshold.
- message is actually delivered (2xx from graph api).
- lead classification (score, stage, sentiment) is updated in `contacts` table.
- action is logged and visible in a simple recent-actions list.

## step-by-step roadmap
1) webhook intake (done)
   - receive dm events, extract `ig_user_id`, `sender_id`, `text`.

2) integration + token resolution (done)
   - fetch user integration from `instagram_integration` using `ig_user_id`.

3) reply engine (this pr)
   - implement a tiny reply service:
     - fetch last 10 messages from `contacts` table for context.
     - generate reply using existing ai helper with user's custom system prompt.
     - compute confidence score (simple heuristic: intent keywords + model logit or rule-based 0.0–1.0).

4) sending policy
   - auto mode only: if confidence ≥ threshold (default 0.8), send immediately via `sendInstagramMessage`.
   - no draft mode for now.

5) persistence
   - store: last generated reply, confidence, result (sent), timestamp.
   - update contact's stage, sentiment, and lead score directly in `contacts` table.

6) ui stitching (minimal)
   - sidekick panel shows:
     - confidence meter
     - recent actions (last 10)
     - system prompt editor

7) follow-up trigger (basic)
   - frontend-only: fetch contacts from `/sidekick` page and show those needing follow-up.
   - criteria: last message > 24h ago, stage not "closed", no recent sidekick action.
   - no db scheduling needed for now.

## simple todo checklist
- [ ] add sidekick settings per user: confidence_threshold, system_prompt (editable)
- [ ] add table for sidekick action logs: action, message_id, text, confidence, result, created_at
- [ ] implement `generateReply({ userId, igUserId, senderId, text, last10Messages })` with ai + context
- [ ] implement `decideAndAct({ reply, confidence, threshold })` (auto-only)
- [ ] wire webhook → reply engine → sender → logger
- [ ] expose recent actions endpoint for ui panel
- [ ] add follow-up detection in frontend (no db scheduling)

## data model (minimal)
- table: `sidekick_setting`
  - user_id (pk, fk user)
  - confidence_threshold float (default 0.8)
  - system_prompt text (default: friendly business tone)
- table: `sidekick_action_log`
  - id, user_id, platform (instagram), thread_id, recipient_id
  - action: sent_reply | follow_up_sent
  - text, confidence, result (sent), created_at

## execution order (week 1)
1) add tables + drizzle migration for settings and logs
2) implement `generateReply` with last 10 messages context and `decideAndAct`
3) connect webhook → reply engine → sender → logger
4) basic recent-actions endpoint and server component for panel
5) follow-up detection in frontend (scan contacts table)
6) smoke tests against real dm events; verify 2xx deliveries

## safety
- never auto-send if confidence < threshold
- blacklist phrases/topics; always fail safe to no-send
- always return 200 from webhook; log errors server-side

## out of scope (later)
- draft mode, multi-platform unification (fb/x), full rag memory, advanced analytics
- human handoff ui, deep pipeline automation, db-based follow-up scheduling
 
## react actions storage decision
- store in `sidekick_action_log` table with action types: `sent_reply`, `follow_up_sent`
- each log entry includes: user_id, platform, thread_id, recipient_id, action, text, confidence, result, created_at
- ui fetches last 10 actions from this table to display in the sidekick panel
- no need for separate react state or complex caching - just db queries
 
## follow-up detection approach
- frontend-only: in `/sidekick` page, query `contacts` table for:
  - contacts with last_message_at > 24h ago
  - stage not "closed" or "ghosted"
  - no recent sidekick action in last 24h
- display these as "needs follow-up" in the ui
- no db scheduling or cron jobs needed for v1
- user manually triggers follow-up from the ui when ready
 
## system prompt customization
- store in `sidekick_setting.system_prompt` as editable text field
- default: friendly business tone with lead qualification focus
- user can edit via settings page or inline in sidekick panel
- prompt gets passed to ai model for every reply generation
- no complex prompt templates - just one editable string per user

---

# detailed db columns (new tables)

1) `sidekick_setting`
- `user_id` (text, pk, fk → `user.id`): the owner of this sidekick configuration; 1:1 with user.
- `confidence_threshold` (numeric/float, default 0.8, not null): minimum confidence to auto-send a reply.
- `system_prompt` (text, not null, default to a short friendly business tone): user-editable base system prompt used for reply generation.
- `created_at` (timestamp, default now): record creation time.
- `updated_at` (timestamp, default now): record update time; update on change.

Indexes/uniques:
- primary key on (`user_id`).

Notes:
- settings are read on every inbound dm to configure generation and filtering.

2) `sidekick_action_log`
- `id` (text, pk): uuid for the action log entry.
- `user_id` (text, fk → `user.id`, not null): owner of the action.
- `platform` (text enum: 'instagram', not null): which platform handled the action (future-proof for fb/x).
- `thread_id` (text, not null): conversation thread id (ig conversation id or synthetic id).
- `recipient_id` (text, not null): the peer/user the message was sent to (ig sid).
- `action` (text enum: 'sent_reply' | 'follow_up_sent', not null): type of sidekick action taken.
- `text` (text, not null): the message content that was sent by the sidekick.
- `confidence` (numeric/float, not null): model confidence computed at generation time.
- `result` (text enum: 'sent', not null): outcome (for v1 always 'sent').
- `created_at` (timestamp, default now, not null): when this action occurred.
- `message_id` (text, nullable): graph api returned message id if available.

Indexes:
- index on (`user_id`, `created_at` desc) for recent actions view.
- index on (`thread_id`, `created_at` desc) for per-thread audit.

Notes:
- ui reads last 10 by `user_id` + created_at desc for the "recent actions" panel.

Relationship with existing tables:
- `contact` table still tracks stage, sentiment, leadScore; we update these directly post-send.

---

# where to start first (implementation order)
1) add drizzle schema + migration for `sidekick_setting` and `sidekick_action_log` in `drizzle/migrations` and `src/lib/db/schema.ts`.
2) implement `generateReply` service (server) that:
   - loads `sidekick_setting` (system_prompt, threshold)
   - fetches last 10 messages for the thread/contact for context
   - calls ai and returns { text, confidence }
3) wire webhook handler to call `generateReply`, evaluate threshold, send via `sendInstagramMessage`, then:
   - update `contact` row (stage, sentiment, leadScore)
   - insert `sidekick_action_log` row
4) build a simple endpoint `GET /api/sidekick/actions` to return last 10 actions for the current user.
5) add the system prompt editor in the sidekick panel; save to `sidekick_setting.system_prompt`.

---

# code references (as context)
- `src/app/api/webhooks/instagram/route.ts` — webhook intake and auto-reply path (entry point)
- `src/lib/instagram/api.ts` — axios sender: `sendInstagramMessage`
- `src/lib/instagram/integration.ts` — integration lookup helpers
- `src/actions/contacts.ts` — patterns for axios ig calls, contact analysis, and db updates
- `src/lib/db/schema.ts` — existing drizzle schema definitions (extend here)
- `drizzle/migrations/*` — add migrations for the two new tables
- `src/app/(dashboard)/(workspace)/sidekick/page.tsx` — ui surface to list recent actions and follow-ups (create/extend)