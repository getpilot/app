# Supermemory Memory Architecture for Pilot Sidekick

## Summary
- Use Supermemory for three memory scopes:
  - `business knowledge`: durable user-owned facts from `userFaq`, `userOffer`, `userOfferLink`, `userToneProfile`, and `user.main_offering` only
  - `contact memory`: per-contact Instagram DM history, seeded from active threads only
  - `workspace memory`: in-app Sidekick chat history and durable workspace decisions
- Postgres remains the source of truth. Supermemory is the retrieval layer for recall, not the authoritative store for prices, FAQs, offers, contacts, or settings.
- In-app Sidekick should stay `memory + live tools`. Memory handles recall; existing tools handle live reads, mutations, and anything that must be exact now. Do not try to make v1 memory-only.
- Remove `sidekick_setting` and all editable system-prompt behavior. Keep only tone/persona from `userToneProfile` and sidekick onboarding.
- Relevant Supermemory surfaces: document ingestion and stable updates/deletes ([manage documents](https://supermemory.ai/docs/api-reference/manage-documents/add-document)), semantic retrieval ([search](https://supermemory.ai/docs/api-reference/search/search-memory-entries)), compact recall/profile generation ([profiles](https://supermemory.ai/docs/api-reference/profile/get-user-profile)), and filtering/entity context ([filtering](https://supermemory.ai/docs/concepts/filtering), [org settings](https://supermemory.ai/docs/org-settings)).

## Memory Model
- Add `SUPERMEMORY_API_KEY` to env validation and `.env.example`.
- Build one server-only `supermemory` module in `@pilot/core` using direct HTTP calls. Use stable `customId`s for writes and deletes; use `profile` and `search` for reads.
- Define container tags:
  - `pilot:user:{userId}:knowledge`
  - `pilot:user:{userId}:workspace`
  - `pilot:user:{userId}:contact:{contactId}`
- Define business-knowledge documents with one stable document per record:
  - `knowledge:main-offering`
  - `knowledge:faq:{faqId}`
  - `knowledge:offer:{offerId}`
  - `knowledge:offer-link:{linkId}`
  - `knowledge:tone:{toneProfileId}`
- Document content rules:
  - `user.main_offering`: only business-facing offering text, never name/email/gender or other personal fields
  - `userFaq`: question + answer
  - `userOffer`: offer name, description/content, and value/price if present
  - `userOfferLink`: type + URL + short label
  - `userToneProfile`: tone type + sample text summary; store for style recall, but still read live tone from Postgres when generating replies
- Add metadata to every document: `userId`, `scope`, `kind`, `recordId`, `platform`, `contactId/sessionId` where applicable, `updatedAt`.
- Configure Supermemory filtering/entity context:
  - `knowledge`: “business facts for answering prospects and helping the workspace owner; keep prices, offers, FAQs, links, policies, tone”
  - `contact`: “durable facts about one customer relationship; keep intent, objections, budget, timeline, product interest, follow-up promises”
  - `workspace`: “durable internal Sidekick conversation context; keep decisions and preferences, skip chatter”

## Runtime Behavior
- DM reply generation:
  - Keep recent IG messages as short-term context.
  - Retrieve `knowledge` memory for every DM reply.
  - Retrieve `contact` memory for that sender on every DM reply.
  - Compose the model context from:
    - recent IG transcript
    - retrieved business knowledge
    - retrieved contact memory
    - live tone profile
    - minimal fixed task instruction
  - Do not inject raw giant business prompts anymore.
- DM memory writes:
  - On inbound webhook after dedupe, append the customer message to the contact transcript.
  - On successful outbound send, append Sidekick’s reply to the same contact transcript.
  - If HRN or billing blocks a reply, still persist the inbound message.
- Business-knowledge sync:
  - Every create/update/delete of `userFaq`, `userOffer`, `userOfferLink`, `userToneProfile`, or `user.main_offering` must enqueue a matching Supermemory upsert/delete event.
  - Use Inngest for these writes so UI/server actions do not block on Supermemory.
  - Updates overwrite the same `customId`; deletes remove the matching document.
  - This is the “forever memory” part for prices, FAQs, offer links, and offering details.
- In-app Sidekick chat:
  - Before `streamText`, retrieve:
    - `knowledge` memory for the user’s latest message
    - `workspace` memory for prior internal Sidekick context
  - Inject both into a fixed internal system prompt.
  - Keep current tools for live data and mutations.
  - Add only memory-specific read tools:
    - `searchBusinessMemory(query, limit?)`
    - `searchContactMemory(contactId, query, limit?)`
  - Do not add a generic “search all memories blindly” tool in v1.
  - On chat finish, append the final user/assistant turn to `workspace` memory.
  - On chat-session delete, delete the matching workspace transcript document.

## Product and Schema Changes
- Remove `sidekick_setting` / `sidekickSetting`.
- Remove:
  - `getSidekickSettings`
  - `updateSidekickSettings`
  - `updateSystemPrompt`
  - Sidekick settings textarea/UI for custom prompt editing
- Keep tone only through onboarding + `userToneProfile`.
- Add `contact.memorySeededAt` for DM backfill tracking.
- Do not add DB copies of Supermemory documents.
- Keep `chat_session` and `chat_message` for UI history.
- Trigger DM backfill only for active threads:
  - `lastMessageAt >= now - 60 days`
  - or `stage in ('lead', 'follow-up')`
  - or `followupNeeded = true`
  - or `requiresHumanResponse = true`
- Do not backfill all historical business data via thread scanning. Structured business knowledge sync is full and immediate; DM history backfill is active-thread only.

## Testing and Acceptance
- Unit tests:
  - document builders for each knowledge source
  - sanitization to ensure only `main_offering` from `user` enters memory
  - custom ID generation
  - memory context assembly for DM replies and in-app chat
  - active-thread selection logic
- Integration tests:
  - FAQ/offer/link/tone/main-offering create-update-delete emit correct Supermemory sync jobs
  - DM inbound/outbound events append correct contact transcript entries
  - chat session save/delete syncs workspace memory correctly
  - chat route still works when Supermemory is down
- Manual acceptance:
  - add an offer with value `$20`; ask in DMs “what’s the price for xyz?” and verify the reply uses the stored price
  - update that offer price and verify new replies use the updated value, not stale memory
  - delete an FAQ or offer and verify Sidekick stops citing it after sync
  - ask the in-app Sidekick a business question answerable from FAQ/offer/link data and verify it answers without needing a live mutation tool
  - ask the in-app Sidekick to modify an offer/contact and verify it still uses live tools, not memory
  - message a lead, wait, then resume later and verify DM replies recall earlier interest/objections
  - verify no user personal info other than business-facing `main_offering` is retrievable from Supermemory
  - verify Sidekick settings no longer expose editable system prompts

## Assumptions and Defaults
- Supermemory handles embeddings/indexing internally; Pilot does not train vectors directly.
- Structured business knowledge is synced fully and durably; only DM history uses active-thread backfill.
- Tone is stored in memory for retrieval context, but live tone data from Postgres remains authoritative for generation.
- In-app Sidekick uses all current live tools plus memory. “Without tools” is not the right design for v1 because memory cannot safely replace exact reads/writes.
- Existing custom system prompts are discarded and not migrated.
