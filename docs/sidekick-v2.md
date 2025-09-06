# sidekick v2: ai agent with database access — implementation plan

## overview
sidekick v2 transforms the existing sidekick (currently a reply bot driven by prompts) into an in‑app ai agent that can understand and act on the user's own data. this agent lives inside the app (not instagram), can read/write to the app database through explicitly defined tools, and strictly limits itself to accessing only the data of the user. a compact chat entrypoint will be available globally as a floating button that opens a right‑hand sidebar.

## goals
- provide an in‑app chat ui for sidekick with a minimal footprint (floating icon → sidebar panel).
- deliver a basic ai chat experience first, then upgrade to an ai agent.
- enable safe, auditable database read/write via tool calling (only sidekick‑scoped operations, and only for the user's own data).
- enforce strict refusal for out‑of‑scope requests (e.g., weather, unrelated topics).

## non‑goals
- no instagram integration in v2.
- no rag or embeddings work in v2 (reserved for v3).
- no general‑purpose assistant behaviors; sidekick remains task‑ and data‑scoped to this app.

## phased rollout
- v1 (done): reply bot using system prompts and basic prompting.
- v2 (this work): in‑app ai agent with database access (read/write, user’s own data only), strict scope enforcement, and chat ui.
- v3 (future): rag‑based file uploads and embeddings for user‑provided data. mention only here; no research or implementation in this doc.

# architecture overview

## ui
- use ai sdk elements for the chat interface, leveraging vercel's components to accelerate delivery and ensure a11y and streaming support.
- a floating action button (fab) anchored bottom‑right opens a right sidebar covering approximately 50% of the remaining space after the main sidebar. the chat panel hosts conversation history, input, streaming responses, and minimal controls.
- adopt the vercel chat ui template as a baseline for structure and interaction patterns.

## backend & ai runtime
- use vercel ai sdk for model orchestration, streaming responses, tool calling, and agent turns.
- models: google gemini 2.5 flash for fast, responsive chat loops; elevate to gemini 2.5 pro for heavier reasoning tasks. default to flash; selectively switch to pro when needed based on tool complexity or token budget.
- tool calling: define explicit tools for sidekick operations (e.g., read_user_settings, update_user_settings, fetch_contacts, update_followups). tools must be pre‑validated, strictly parameterized, and only access the data of the user.

## data access
- db access is never direct from the model; it happens only via server‑side tool functions. all tool calls validate input, enforce auth/tenant boundaries, and log execution. all data access is strictly limited to the user's own data.
- write operations must produce human‑readable audit logs (actor=sidekick, user id, operation, inputs, outcome).

## scope & safety
- system and developer prompts enforce sidekick scope; unrelated queries (e.g., weather, testing) must be refused with a brief explanation and guidance to supported tasks.
- apply allow‑list tooling; no generic evaluate/execute tools. strong validation on inputs. rate limit and monitor tool invocations.

# technology stack
- ui components: ai sdk elements (chat components and primitives) and existing shadcn/tailwind styles in the app.
- ai integration: vercel ai sdk (core + ui hooks) for streaming + tool calling.
- model provider: google gemini 2.5 flash (default), gemini 2.5 pro (fallback for complex reasoning). choose flash for latency‑sensitive chat; escalate to pro for multi‑step planning or complex db write decisions.

references:
- agents & tools (vercel docs): [using tools](https://vercel.com/docs/agents#using-tools)
- ai sdk core: tools and tool calling: [docs](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- ai sdk foundations: [tools](https://ai-sdk.dev/docs/foundations/tools), [agents](https://ai-sdk.dev/docs/foundations/agents), [providers & models](https://ai-sdk.dev/docs/foundations/providers-and-models)
- next.js app router getting started: [guide](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- gemini 2.5 (cookbook): [guide](https://ai-sdk.dev/cookbook/guides/gemini-2-5)
- ui templates: [chat-sdk.dev](https://chat-sdk.dev/), [vercel ai chatbot template](https://github.com/vercel/ai-chatbot)

# implementation plan

## phase a — initial chat ui (v2 step 1)
objective: integrate the chat ui components and deliver a basic ai chat (no tools).

- setup component library for ai chat
  - adopt ai sdk elements for the chat surface.
  - ensure consistent theming with the app (tailwind/shadcn). reuse tokens and typography.

- floating icon entrypoint
  - add a small fab at bottom‑right across authenticated pages.
  - fab opens a right‑hand sidebar panel.

- right sidebar layout
  - width: ~50% of remaining content area (after main sidebar).
  - sticky header with title and close/minimize controls.
  - content: streaming messages, minimal status, input at bottom.

- basic ai wiring
  - connect chat ui to a minimal chat endpoint using vercel ai sdk streaming.
  - model: gemini 2.5 flash.
  - system prompt: friendly, concise assistant; clearly communicate that sidekick is evolving and currently answers simple queries.

- acceptance criteria
  - fab visible and accessible.
  - sidebar opens/closes smoothly and is responsive.
  - chat sends/receives streamed responses.
  - no database access yet.

## phase b — simple agent with a test tool (weather) (v2 step 2)
objective: validate tool calling with a harmless, non‑production tool (weather), gated to development.

- agent upgrade
  - enable tool calling in the chat endpoint.
  - define a simple tool (e.g., get_weather) that returns a deterministic mock or calls a public api in development only.
  - clearly mark the tool as dev‑only and hide behind an environment flag.

- guardrails
  - system instruction: sidekick must refuse non‑sidekick topics in production; weather tool is permitted only in development. in production, weather requests return a refusal message.

- acceptance criteria
  - in development: model can call get_weather when prompted.
  - in production: model refuses weather requests and points to supported sidekick features.

## phase c — sidekick‑scoped agent with database access (v2 step 3)
objective: implement read/write tools that operate only on the user's own sidekick data.

- define tools (examples; exact set depends on existing schema)
  - read_sidekick_settings(user_id)
  - update_sidekick_settings(user_id, partial_settings)
  - list_followups(user_id, filters)
  - create_followup(user_id, payload)
  - update_followup_status(user_id, followup_id, status)

- tool design principles
  - validate and coerce inputs rigorously (zod or equivalent) before any db call.
  - enforce tenant scoping using the authenticated user/session. all data access is limited to the user's own data.
  - return compact, structured outputs with human‑readable summaries for the model.
  - write operations emit audit logs (operation, params, result, timestamp, user id).

- prompt and policy
  - system instructions strictly limit sidekick to supported tools.
  - explicit refusal policy for out‑of‑scope asks with a brief explanation and list of supported actions.

- observability & ops
  - log: model prompts (sanitized), tool invocations, durations, and error rates.
  - alert on repeated tool errors and elevated refusal rates.

- acceptance criteria
  - read and write flows function end‑to‑end with streaming responses.
  - inputs validated; unauthorized or malformed requests are safely rejected.
  - audit trails exist for all writes.

### Tools

**1. User Profile Tools**

(so the agent can understand and update who the user is)

* `getUserProfile(userId)` → name, email, gender, use\_case, business\_type, main\_offering.
* `updateUserProfile(userId, fields)` → partial update of the above.

**2. Offers Tools**

(for managing what the user sells)

* `listUserOffers(userId)` → all rows in `user_offer`.
* `createUserOffer(userId, name, content, value)`
* `updateUserOffer(offerId, fields)`
* `deleteUserOffer(offerId)`
* `listUserOfferLinks(userId)`
* `addUserOfferLink(userId, type, url)`

**3. Tone & Training Tools**

(so Sidekick knows how to speak in the user’s voice)

* `getToneProfile(userId)` → toneType, sampleText, files.
* `updateToneProfile(userId, fields)`
* (optional) `addToneSample(userId, text)`

**4. Objections & FAQs Tools**

(for capturing sales knowledge)

* `listObjections(userId)`
* `addObjection(userId, objection)`
* `listFaqs(userId)`
* `addFaq(userId, question, answer)`
* `updateFaq(faqId, fields)`
* `deleteFaq(faqId)`

**5. Sidekick Settings**

(for the system prompt / global behavior)

* `getSidekickSettings(userId)`
* `updateSidekickSettings(userId, systemPrompt)`

**6. Action Logs**

(only if you want the AI to review its own history)

* `listActionLogs(userId, limit=20)`
* `getActionLog(actionId)`

## phase d — polish and hardening (v2 step 4)
objective: refine ux, performance, and safety for production readiness.

- ux
  - message persistence per user session, basic pagination for history in the sidebar.
  - accessible focus management for fab and chat input.

- performance
  - default to gemini 2.5 flash; auto‑switch to pro for specific complex tool flows if needed (feature‑flagged).
  - streaming enabled end‑to‑end; chunked rendering in ui.

- safety
  - rate limit tool usage per user.
  - input size caps and content moderation hooks if required.

- acceptance criteria
  - sustained low latency for typical interactions.
  - no unexplained tool calls; auditable trails.

# testing strategy
- unit tests for tool input validation and auth/tenant enforcement.
- integration tests for end‑to‑end chat → tool → db flows.
- red‑team prompts to probe scope boundaries and ensure consistent refusals.

# rollout plan
- dev: enable weather tool; iterate on ui and agent behaviors.
- staging: disable weather; exercise db tools with seeded data and audit logging.
- production: phased rollout behind a feature flag; progressive exposure to user cohorts.

# risks and mitigations
- model overreach (hallucinated tools or actions): mitigate with allow‑listed tools and strict system prompts; reject unknown tool names.
- data leakage: sanitize logs, avoid returning sensitive fields via tools, and enforce row‑level scoping so only the user's own data is accessible.
- performance regressions: prefer gemini 2.5 flash; gate pro usage; monitor latency.

# v3 note (future)
- introduce rag: file upload, chunking, embeddings, and retrieval with pgvector for user‑specific knowledge grounding. not part of the current scope; tracked as a future phase.

# acceptance checklist
- floating chat icon present on all relevant pages; opens right sidebar covering ~50% of remaining space.
- basic ai chat operational (streaming, gemini 2.5 flash).
- dev‑only weather tool validated; production refuses non‑sidekick requests.
- sidekick‑scoped db tools implemented with strict validation and audit logs, and only access the user's own data.
- refusal policy consistently enforced; unrelated requests are declined.
- monitoring and logs in place for prompts, tools, and errors.

# references
- ai sdk elements (chat ui examples): [chat-sdk.dev](https://chat-sdk.dev/)
- vercel ai chatbot template: [github.com/vercel/ai-chatbot](https://github.com/vercel/ai-chatbot)
- agents on vercel (tools): [vercel.com/docs/agents#using-tools](https://vercel.com/docs/agents#using-tools)
- ai sdk core — tools & tool calling: [ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- ai sdk foundations: [tools](https://ai-sdk.dev/docs/foundations/tools), [agents](https://ai-sdk.dev/docs/foundations/agents), [providers & models](https://ai-sdk.dev/docs/foundations/providers-and-models)
- next.js app router getting started: [ai-sdk.dev/docs/getting-started/nextjs-app-router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- gemini 2.5 cookbook: [ai-sdk.dev/cookbook/guides/gemini-2-5](https://ai-sdk.dev/cookbook/guides/gemini-2-5)