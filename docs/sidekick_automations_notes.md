# instagram automations feature – implementation notes

## overview
- purpose: implement instagram comment- and dm-triggered “automations” that reply with either a fixed message or an ai-generated response.
- scope: oauth to obtain tokens, webhook verification and processing, db queries to resolve automations/keywords, messaging via graph api, chat history for ai, integration creation, and safety/rate-limit considerations.

## key flows

1. **oauth + integration creation**
   - user clicks “connect instagram” → server redirects to instagram oauth url (`process.env.INSTAGRAM_EMBED_OAUTH_URL`).
   - instagram redirects back to `callback/instagram` with `code` (may include a `#_` suffix; split on `#` and take first part).
   - server action `onIntegrate(code)`:
     - checks if user already has an instagram integration.
     - generates tokens via `generateTokens(code)`:
       - posts form data to `process.env.INSTAGRAM_TOKEN_URL` with fields: `client_id`, `client_secret`, `grant_type=authorization_code`, `redirect_uri`, `code`.
       - exchanges short-lived token for long-lived token (valid ~60 days) via `GET {INSTAGRAM_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=...&access_token=...`.
     - fetches user’s instagram id via `GET {INSTAGRAM_BASE_URL}/me?fields=id&access_token=...`.
     - computes `expires_at = today + 60 days`.
     - creates integration record with token, expires_at, instagram_id; returns user name for redirect.
   - result: user redirected to dashboard integrations page on success; to sign-up on failure.

2. **webhook setup and verification**
   - endpoint: `/api/webhook/instagram` (folder-structured under `/api/webhook/instagram/route.ts`).
   - get (verification): respond with `hub.challenge` from `request.nextUrl.searchParams.get('hub.challenge')` using `NextResponse`. this is required once by instagram to validate the webhook.
   - post (events): parse `await request.json()` into `webhookPayload`; handle messaging and comment change events.

3. **core webhook processing (post)**
   - parse payload:
     - dms: `webhookPayload.entry[0].messaging[0].message.text` and `sender.id`.
     - comments: `webhookPayload.entry[0].changes[0].value.text`, `value.comment_id`, `value.from.id`, `entry[0].id` (instagram business account id).
   - keyword detection:
     - call `matchKeyword(text)` to find a keyword record (case-insensitive) → returns `{ automationId, ... }` if matched.
   - two top-level branches:
     - a) messaging (dm) event present
     - b) comments change event with `field === 'comments'`

   ### a) dm branch
   - fetch automation details: `getKeywordAutomation(automationId, dm=true)` including:
     - dms (boolean include), trigger (dm/comment), listener (message or smart_ai), user (subscription.plan), integrations (token).
   - require: automation and automation.trigger exist.
   - listener paths:
     1. message listener (static/direct reply)
        - send dm via `sendDM({ userId, receiverId: sender.id, prompt: listener.prompt, token })`.
          - endpoint: `POST {INSTAGRAM_BASE_URL}/v21.0/{userId}/messages` with headers `Authorization: Bearer {token}`, `Content-Type: application/json` and body `{ recipient: { id: receiverId }, message: { text: prompt } }`.
        - on 200, track response: `trackResponses(automationId, 'DM')` (increments dm_counts), return 200 json.
     2. smart ai listener (requires pro plan)
        - check `user.subscription.plan === 'Pro'`.
        - generate reply via openai chat completions using `automation.listener.prompt` with instruction to keep under two sentences.
        - if a message was produced, persist chat history for both receiver and sender via `createChatHistory(automationId, senderId, receiverId, messageText)` using a db transaction.
        - send dm as above with ai content; on 200, `trackResponses(automationId, 'DM')`, return 200.

   ### b) comment branch
   - confirm this is a comment payload: `entry[0].changes[0].field === 'comments'`.
   - fetch automation (dm=false) and the referenced post via `getKeywordPost(postId, automationId)` to ensure the comment belongs to the correct post tied to the automation.
   - require automation.trigger and automation.listener.
   - listener paths:
     1. message listener
        - instagram restriction: cannot cold-dm from comments for privacy; workaround is to send a “private reply” tied to the comment thread.
        - use `sendPrivateMessage({ userId, commentId: value.id, prompt, token })`:
          - endpoint variant: remove version segment, use comment recipient semantics: `POST {INSTAGRAM_BASE_URL}/{userId}/messages` with `{ recipient: { comment_id: value.id }, message: { text: prompt } }` and same headers.
        - on 200, `trackResponses(automationId, 'comment')`, return 200.
     2. smart ai listener (requires pro plan)
        - generate ai reply via openai using the listener prompt; persist chat history (receiver/sender) with a transaction.
        - send private message as above (comment_id recipient); on 200, `trackResponses(automationId, 'comment')`, return 200.

   ### c) no keyword case (continued conversation)
   - if no keyword matched, attempt to load prior chat via `getChatHistory(recipientId, senderId)`.
   - if history exists, find automation by id (`findAutomation`) including subscription and integrations.
   - if listener is smart ai and plan is pro, continue conversation:
     - call openai with: assistant prompt (automation listener prompt), prior history, and current user message as a `user` role.
     - store new receiver/sender messages, send dm/private reply, track, return 200.
   - if not permitted or not configured, respond with 404 “no automation set”.

## db/server actions and helpers

- `matchKeyword(keyword: string)`: find keyword by word (case-insensitive) → returns automation id.
- `getKeywordAutomation(automationId: string, dm: boolean)`: fetch automation with includes (dms, trigger[dm/comment], listener, user.subscription.plan, integrations.token).
- `createChatHistory(automationId: string, senderId: string, receiverId: string, message: string)`: updates automation.dms with a new dm entry for both sides; often executed inside a transaction.
- `trackResponses(automationId: string, type: 'comment' | 'DM')`: increments listener.comment_count or listener.dm_counts.
- `getKeywordPost(postId: string, automationId: string)`: find post tied to automation; select automationId.
- `findAutomation(id: string)`: fetch automation with keyword, trigger, post, listener, user (select subscription and integrations).
- `getChatHistory(recipientId: string, senderId: string)`: fetch previous messages to determine continued conversation eligibility.
- `getIntegration(clerkId: string)`: returns user’s instagram integration records.
- `createIntegration({ clerkId, token, expiresAt, instagramId })`: attaches integration to user; returns names for redirect.

## lib functions

- `sendDM({ userId, receiverId, prompt, token })`: posts to `v21.0/{userId}/messages` with bearer auth.
- `sendPrivateMessage({ userId, commentId, prompt, token })`: similar to sendDM but recipient uses `comment_id`, no version segment in path; used to initiate message from a comment.
- `generateTokens(code: string)`: exchanges code → short token → long-lived token; returns token data.

## api routes and pages

- `/api/webhook/instagram`:
  - get: return `hub.challenge` for verification.
  - post: main dispatcher for messaging and comments.
- `/app/callback/instagram/page.tsx`:
  - async server component; parses `code` from search params, calls `onIntegrate`, redirects to user dashboard integrations on success.
- loading component mirrors payment loading for user feedback.

## environment/config required

- `INSTAGRAM_EMBED_OAUTH_URL`: oauth authorization url provided by meta.
- `INSTAGRAM_BASE_URL`: base graph api url.
- `INSTAGRAM_TOKEN_URL`: token exchange endpoint.
- `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`: app credentials.
- `NEXT_PUBLIC_HOST_URL`: used to form redirect uri: `{HOST_URL}/callback/instagram`.
- any versioning constant (v21.0) used in `sendDM` only.

## openai integration (smart ai)

- model: chat.completions api; instruct to keep responses under two sentences.
- includes: assistant prompt (from automation.listener.prompt), optional prior conversation history, current user message.
- stores conversation entries to allow continued threads when no keyword is present.

## important instagram constraints and operational notes

- privacy: if the commenter/dm sender has restrictive privacy settings, messages may not deliver.
- cold dms from comments: not allowed; must use private replies via `comment_id`.
- 24-hour window: conversations can continue for 24h since last user interaction; messages beyond may fail.
- webhook responses must be 200: non-200 causes instagram to retry frequently and risks bans; ensure all successful paths return 200 json.
- versioning: use `v21.0` for direct dms; omit version for private replies as described in the workaround.
- testing: watch server logs; verify 200s; ensure redirect uri matches instagram app settings; avoid premature live configuration to prevent rate/ban issues.

## frontend linkage (minimal)

- integrations button triggers redirect strategy to instagram oauth; ui disables button when connected.
- shows connected vs connect based on integration presence.

## end-to-end sequence (condensed)

1. user connects instagram → oauth → tokens → integration saved.
2. instagram verifies webhook via `hub.challenge`.
3. on comment or dm event:
   - extract text and sender/ids.
   - try `matchKeyword(text)`.
   - if matched → load automation → branch by event (dm/comment) and listener (message/smart_ai) → send dm/private reply → track → 200.
   - if not matched → check chat history and eligibility → continue smart ai flow if allowed → track → 200; else 404.

## testing checklist

- set all non-error returns to 200 to avoid retries.
- validate `redirect_uri` alignment in meta app config.
- ensure required envs present; axios vs fetch differences (token exchange uses fetch).
- confirm db tables: user, integrations, automation, keywords, listener, dms, posts, chat history.
- simulate comment "start" and dm keywords; observe logs and webhook deliveries.

## limitations & risks

- reliance on undocumented/fragile parts of instagram api (private reply semantics) may change.
- privacy settings and 24h window can cause non-deterministic delivery failures.
- rate limits/ban risks if webhook returns non-200 or if flows are abused.

## what to implement (code artifacts referenced)

- actions/webhook/queries.ts: matchKeyword, getKeywordAutomation, createChatHistory, trackResponses, getKeywordPost, findAutomation, getChatHistory.
- lib/fetch.ts: sendDM, sendPrivateMessage, generateTokens.
- api/webhook/instagram/route.ts: get (verification), post (dispatcher/logic).
- app/callback/instagram/{loading.tsx,page.tsx}: handle oauth completion ui + redirect.