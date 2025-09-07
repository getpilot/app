import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  gender: text("gender"),
  use_case: text("use_case").array(),
  other_use_case: text("other_use_case"),
  leads_per_month: text("leads_per_month"),
  active_platforms: text("active_platforms").array(),
  other_platform: text("other_platform"),
  business_type: text("business_type"),
  other_business_type: text("other_business_type"),
  pilot_goal: text("pilot_goal").array(),
  current_tracking: text("current_tracking").array(),
  other_tracking: text("other_tracking"),
  main_offering: text("main_offering"),
  onboarding_complete: boolean("onboarding_complete").default(false),
  sidekick_onboarding_complete: boolean("sidekick_onboarding_complete").default(
    false
  ),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const instagramIntegration = pgTable("instagram_integration", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // PROFESSIONAL ACCOUNT ID USED BY WEBHOOKS (IG GRAPH "user_id")
  instagramUserId: text("instagram_user_id").notNull(),
  // APP-SCOPED USER ID FROM GRAPH "me.id" (useful for diagnostics)
  appScopedUserId: text("app_scoped_user_id"),
  username: text("username").notNull(),
  accessToken: text("access_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  syncIntervalHours: integer("sync_interval_hours").default(24),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contact = pgTable("contact", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  username: text("username"),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  stage: text("stage")
    .default("new")
    .$type<"new" | "lead" | "follow-up" | "ghosted">(),
  sentiment: text("sentiment")
    .default("neutral")
    .$type<"hot" | "warm" | "cold" | "ghosted" | "neutral">(),
  leadScore: integer("lead_score"),
  nextAction: text("next_action"),
  leadValue: integer("lead_value"),
  triggerMatched: boolean("trigger_matched").default(false),
  followupNeeded: boolean("followup_needed").default(false),
  followupMessage: text("followup_message"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactTag = pgTable("contact_tag", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contact.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactTagUnique = unique("contact_tag_contact_id_tag_unique").on(
  contactTag.contactId,
  contactTag.tag
);

export const userOffer = pgTable("user_offer", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(),
  value: integer("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userToneProfile = pgTable("user_tone_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  toneType: text("tone_type")
    .notNull()
    .$type<"friendly" | "direct" | "like_me" | "custom">(),
  sampleText: text("sample_text").array(),
  sampleFiles: text("sample_files").array(),
  trainedEmbeddingId: text("trained_embedding_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userOfferLink = pgTable("user_offer_link", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type")
    .notNull()
    .$type<"primary" | "calendar" | "notion" | "website">(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userFaq = pgTable("user_faq", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sidekickSetting = pgTable("sidekick_setting", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  systemPrompt: text("system_prompt")
    .notNull()
    .default(DEFAULT_SIDEKICK_PROMPT),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sidekickActionLog = pgTable("sidekick_action_log", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  platform: text("platform").notNull().$type<"instagram">(),
  threadId: text("thread_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  action: text("action").notNull().$type<"sent_reply" | "follow_up_sent">(),
  text: text("text").notNull(),
  result: text("result").notNull().$type<"sent" | "failed">(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  messageId: text("message_id"),
});

export const chatSession = pgTable("chat_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatMessage = pgTable("chat_message", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => chatSession.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<"user" | "assistant">(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const automation = pgTable("automation", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  triggerWord: text("trigger_word").notNull(),
  responseType: text("response_type")
    .notNull()
    .$type<"fixed" | "ai_prompt">(),
  responseContent: text("response_content").notNull(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const automationActionLog = pgTable("automation_action_log", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  platform: text("platform").notNull().$type<"instagram">(),
  threadId: text("thread_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  automationId: text("automation_id")
    .notNull()
    .references(() => automation.id, { onDelete: "cascade" }),
  triggerWord: text("trigger_word").notNull(),
  action: text("action").notNull().$type<"automation_triggered" | "sent_reply">(),
  text: text("text"),
  messageId: text("message_id"),
  createdAt: timestamp("created_at").defaultNow(),
});