# 📇 PRD — **Contacts Module**

## 🧠 Vision

This is your CRM-lite built for chaos. Every Instagram DM turns into a lead profile — scored, tagged, and ranked by AI. The creator opens this, and instantly knows who’s worth their time and what move to make next.

---

## 🎯 Goals (V1)

1. Display all Instagram DM contacts in a **table view**.
2. Allow users to **edit tags** manually (inline or modal).
3. Add a button to **Auto Tag / Score** contacts using AI.
4. Use **Inngest** to run async AI pipelines (non-blocking, reliable).
5. Prepare foundation for sorting, filtering, automations.

---

## 🔧 Features & Functionality

### 1. Table View (Main UI)

List all DM contacts pulled from IG. Paginate with 10/page.

**Columns**:

| Avatar | Name | Tags | Last Message | Last Message At | Sentiment | Score | Actions |
| ------ | ---- | ---- | ------------ | --------------- | --------- | ----- | ------- |

* **Tags**: editable, inline or via popover.
* **Last Msg**: truncated preview (`msg.slice(0, 50)...`)
* **Score**: integer (0-100)
* **Sentiment**: 🔥 hot / 🧊 cold / 💤 ghosted / ❄️ unsure
* **Actions**:

  * View Full Chat
  * Edit Tags
  * Manual Scoring (optional for testing)

---

### 2. Manual Tag Editing

When a user clicks on the tag field:

* A **tag selector** pops up (dropdown/multi-select).
* User can create new tags (autocomplete input).
* Tags saved immediately to DB.

Tags = free-form or predefined. You decide — but support free-form for now.

---

### 3. Auto Tag / Score Button

Button at top-right:
**\[✨ Auto Tag & Score All Contacts]**

* When clicked, run an **Inngest job** in background:

  * For every contact without tags or score:

    * Send recent 5–10 messages + context to AI
    * Get:

      * `tags[]`
      * `lead_score (0–100)`
      * `sentiment`
    * Update DB with results

Use **toast + polling** to show progress (`10/120 contacts processed...`).

---

### 4. AI Pipeline (via Inngest)

You don’t run AI in user-request context. It’s async, safe, and retryable.

**Event:** `contact.auto_tag_score`

**Trigger Input**:

```ts
{
  userId: string,
  contactIds: string[]
}
```

**Pipeline Steps**:

1. Fetch contact’s last X messages
2. Pull onboarding context of user
3. Send prompt to **Gemini (via Vercel AI SDK)**
4. Parse output: tags, score, sentiment
5. Update `contacts` table

---

## 🧱 DB Schema Additions (if not already there)

```ts
contact: {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  instagramId: text("instagram_id").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  tags: text("tags").array(), // NEW: array of tag strings
  sentiment: text("sentiment"), // hot, cold, ghosted, unsure
  leadScore: integer("lead_score"), // 0–100
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}
```

**Optional**: create a `contact_tags` junction table if you want more control later. But for now, simple `text[]` field works.

---

## ⚙️ Implementation Plan

### Frontend (Next.js + ShadCN + TanStack Query)

* `/contacts` route
* Table UI + inline tag editing
* Auto-Tag button triggers `POST /api/contacts/auto-tag`
* Toast feedback + loading state

### Backend

* `POST /api/contacts/auto-tag`:

  * Validates session
  * Triggers Inngest with list of contact IDs

* Inngest Function:

  * Batches messages + context
  * Sends to Gemini
  * Updates Drizzle DB

---

## 🧠 Prompt to Gemini (Skeleton)

```txt
You are an AI assistant helping categorize and score sales leads from Instagram DMs.

Given the chat history below and user’s context, return:
- Tags (up to 3)
- Lead score (0–100)
- Sentiment (hot, cold, ghosted, unsure)

Chat:
{{chat_snippet}}

User Context:
- Niche: Course creator
- Goal: Automate replies, score leads
```

---

## ✅ Definition of Done

* All contacts show up in paginated table
* User can edit tags for any contact
* Clicking “Auto Tag & Score” runs Inngest and updates values
* No crashes, no broken flows, clean UX
* Inngest pipeline is robust (retries, error logs, timeout-safe)

---

## 🧠 Future

* Sorting / filtering by sentiment, score, tag
* Auto-refresh contact list every X mins
* Trigger AI tagging on new contact addition (real-time)
* Kanban view
* Integration with Automations / Pipelines

---

## 🚀 Phase 1: **Just show the contacts — no DB**

**Goal**: Get the raw Instagram contacts on screen ASAP.

### ✅ Step 1: Fetch IG DMs

* Use your connected access token (you already have this set up).
* Call the endpoint to fetch the user’s DM threads.

```ts
GET https://graph.facebook.com/v18.0/<ig-user-id>/conversations?access_token=...
```

### ✅ Step 2: Extract contact data

From each conversation, extract:

* sender name
* profile pic
* IG user ID
* last message
* last message timestamp

### ✅ Step 3: Render in the dashboard

* Build a simple table view (Tailwind + ShadCN)
* Display these raw values — no filters, no scoring yet.

> 💡 Do NOT overcomplicate here. You're just wiring the pipe.

---

## 🧱 Phase 2: **Sync contacts with DB**

**Goal**: On first load, sync IG contacts into your `contact` table.

### ✅ Step 4: Loop through each contact

```ts
for (const contact of fetchedIGContacts) {
  await upsertContact(userId, contact); // See below
}
```

### ✅ Step 5: Create the `upsertContact()` util

```ts
async function upsertContact(userId: string, igContact: IGContactPayload) {
  const existing = await db.query.contact.findFirst({
    where: and(
      eq(contact.userId, userId),
      eq(contact.instagramId, igContact.senderId),
    ),
  });

  if (!existing) {
    await db.insert(contact).values({
      userId,
      instagramId: igContact.senderId,
      name: igContact.name,
      avatarUrl: igContact.profilePic,
      lastMessage: igContact.lastMessage,
      lastMessageAt: new Date(igContact.timestamp),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    await db.update(contact)
      .set({
        lastMessage: igContact.lastMessage,
        lastMessageAt: new Date(igContact.timestamp),
        updatedAt: new Date(),
      })
      .where(eq(contact.id, existing.id));
  }
}
```

### ✅ Step 6: Make this sync run on dashboard load (client or server side)

* You can do this on server via a `GET /api/sync-contacts` endpoint.
* Or do it directly inside your Next.js page loader if needed.

---

## 🧠 Phase 3: **Auto-tag & Auto-score**

**Goal**: Run AI on every contact and store in DB.

### ✅ Step 7: Add `autoTagAndScore()` endpoint

* Create a button: **"Auto Tag / Score"**
* When clicked, call a route: `POST /api/contacts/auto-score`

### ✅ Step 8: Use Inngest + Gemini for AI

Inside the endpoint:

* For each contact (or batch):

  * Pull their last message
  * Feed it into Gemini + onboarding context
  * Get: sentiment, tag, next move, score
  * Store into DB

```ts
await inngest.send({
  name: "contact.auto-score",
  data: {
    userId,
    contactId,
    lastMessage,
    onboardingData
  },
});
```

The `contact.auto-score` function runs asynchronously, updates the DB when done.

---

## 🧪 Phase 4: **Polish UX**

**Goal**: Make this smooth for the user.

### ✅ Step 9: UI updates

* Show loading spinner when syncing/auto-scoring
* Highlight new contacts with shimmer
* Add ability to edit tags inline
* Add filters/sort later (by score, date, sentiment, etc.)

---

## ✅ Recap Summary

| Step | What you do                               |
| ---- | ----------------------------------------- |
| 1    | Fetch IG contacts from API                |
| 2    | Show raw in table                         |
| 3    | For each contact, check DB: insert if new |
| 4    | Create `upsertContact()` util             |
| 5    | Store: name, pic, IG ID, last msg, time   |
| 6    | On “Auto Tag/Score”, trigger Inngest jobs |
| 7    | Gemini scores contacts → updates DB       |
| 8    | Display score, tags, next action in UI    |