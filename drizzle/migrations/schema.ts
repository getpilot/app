import {
  pgTable,
  foreignKey,
  text,
  timestamp,
  unique,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const contactTag = pgTable(
  "contact_tag",
  {
    contactId: text("contact_id").notNull(),
    tag: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    id: text().primaryKey().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.contactId],
      foreignColumns: [contact.id],
      name: "contact_tag_contact_id_contact_id_fk",
    }).onDelete("cascade"),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ]
);

export const instagramIntegration = pgTable(
  "instagram_integration",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    instagramUserId: text("instagram_user_id").notNull(),
    username: text().notNull(),
    accessToken: text("access_token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    syncIntervalHours: integer("sync_interval_hours").default(24),
    lastSyncedAt: timestamp("last_synced_at", { mode: "string" }),
    appScopedUserId: text("app_scoped_user_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "instagram_integration_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    useCase: text("use_case").array(),
    otherUseCase: text("other_use_case"),
    leadsPerMonth: text("leads_per_month"),
    activePlatforms: text("active_platforms").array(),
    otherPlatform: text("other_platform"),
    businessType: text("business_type"),
    otherBusinessType: text("other_business_type"),
    pilotGoal: text("pilot_goal").array(),
    currentTracking: text("current_tracking").array(),
    otherTracking: text("other_tracking"),
    onboardingComplete: boolean("onboarding_complete").default(false),
    gender: text(),
    sidekickOnboardingComplete: boolean("sidekick_onboarding_complete").default(
      false
    ),
    mainOffering: text("main_offering"),
  },
  (table) => [unique("user_email_unique").on(table.email)]
);

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const contact = pgTable(
  "contact",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    username: text(),
    lastMessageAt: timestamp("last_message_at", { mode: "string" }),
    stage: text().default("new"),
    sentiment: text().default("neutral"),
    leadScore: integer("lead_score"),
    nextAction: text("next_action"),
    leadValue: integer("lead_value"),
    triggerMatched: boolean("trigger_matched").default(false),
    notes: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    lastMessage: text("last_message"),
    followupNeeded: boolean("followup_needed").default(false),
    followupMessage: text("followup_message"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "contact_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const userOffer = pgTable(
  "user_offer",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    content: text().notNull(),
    value: integer(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_offer_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const userToneProfile = pgTable(
  "user_tone_profile",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    toneType: text("tone_type").notNull(),
    sampleText: text("sample_text").array(),
    sampleFiles: text("sample_files").array(),
    trainedEmbeddingId: text("trained_embedding_id"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_tone_profile_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const userOfferLink = pgTable(
  "user_offer_link",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    type: text().notNull(),
    url: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_offer_link_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const userFaq = pgTable(
  "user_faq",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    question: text().notNull(),
    answer: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_faq_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const sidekickActionLog = pgTable(
  "sidekick_action_log",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    platform: text().notNull(),
    threadId: text("thread_id").notNull(),
    recipientId: text("recipient_id").notNull(),
    action: text().notNull(),
    text: text().notNull(),
    result: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    messageId: text("message_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "sidekick_action_log_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const sidekickSetting = pgTable(
  "sidekick_setting",
  {
    userId: text("user_id").primaryKey().notNull(),
    systemPrompt: text("system_prompt")
      .default(
        "You are a friendly, professional assistant focused on qualifying leads and helping with business inquiries."
      )
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "sidekick_setting_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const chatSession = pgTable(
  "chat_session",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    title: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "chat_session_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const chatMessage = pgTable(
  "chat_message",
  {
    id: text().primaryKey().notNull(),
    sessionId: text("session_id").notNull(),
    role: text().notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [chatSession.id],
      name: "chat_message_session_id_chat_session_id_fk",
    }).onDelete("cascade"),
  ]
);

export const automation = pgTable(
  "automation",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    title: text().notNull(),
    description: text(),
    triggerWord: text("trigger_word").notNull(),
    responseType: text("response_type").notNull(),
    responseContent: text("response_content").notNull(),
    isActive: boolean("is_active").default(true),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "automation_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const automationLog = pgTable(
  "automation_log",
  {
    id: text().primaryKey().notNull(),
    automationId: text("automation_id").notNull(),
    triggerWord: text("trigger_word").notNull(),
    responseSent: boolean("response_sent").notNull(),
    deliveryStatus: text("delivery_status").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.automationId],
      foreignColumns: [automation.id],
      name: "automation_log_automation_id_automation_id_fk",
    }).onDelete("cascade"),
  ]
);