## 🔗 Step 1: OAuth Connection

You'll use the **Instagram Graph API** (via Meta App) with the same OAuth flow you've used before. Fastest to reuse your legacy logic. When user connects:

* ✅ Redirect to Meta login
* ✅ Get `access_token`, `user_id`, and `expires_in`
* ✅ Store all in your DB
* ✅ Redirect to `/dashboard`

---

## 🧱 DB Structure: `instagram_integration`

```ts
export const instagramIntegration = pgTable("instagram_integration", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id").notNull().references(() => user.id),
  instagramUserId: text("instagram_user_id").notNull(), // FB Page ID
  username: text("username").notNull(), // IG handle
  accessToken: text("access_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

> ✅ Yes — **store `username`**. It helps for debugging, support, dashboard display, and re-auth flows. No reason not to.

---

## 🧪 Step 2: Token Validation

On every login (or app load), validate the token:

* Call `https://graph.instagram.com/me?access_token=...`
* If 200 → continue.
* If 400/401 → show “Reconnect Instagram” CTA on `/settings`.

Also run a background refresh check every X hours using a **cron or background job**.

---

## ⚙️ Step 3: Refresh Logic

Instagram long-lived tokens expire every \~60 days. You **cannot** make it permanent. But you can **rotate the token** with:

```
GET https://graph.instagram.com/refresh_access_token
  ?grant_type=ig_refresh_token
  &access_token={long-lived token}
```

Store new token + expiry in the DB.

Automate this with:

* **Daily cron** (Vercel Cron, or background queue via BullMQ)
* Refresh every 48 hours

---

## 🔧 Step 4: UI — Settings Page

Page: `/settings/integrations`

* Instagram card:

  * ✅ Status: Connected / Not Connected
  * ✅ IG username (from DB)
  * ✅ Reconnect / Disconnect button

---

## 🌪 Tech Stack to Use

* `axios` for API calls
* `drizzle-orm` for schema
* `neon db` for storage
* `zod` for form validation
* `@polar-sh/better-auth` for protected routes
* `tanstack-query` to fetch + cache status
* `/api/instagram/connect` route to handle auth redirect

---

## ✅ Final Checklist

| Item                     | Status |
| ------------------------ | ------ |
| DB table created         | ✅      |
| IG OAuth implemented     | ✅      |
| Token stored in Neon     | ✅      |
| Token validated on login | ✅      |
| Auto-refresh cron job    | ✅      |
| `/settings` page UI      | ✅      |
| Username stored          | ✅      |