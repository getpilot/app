import {
  pgTable,
  foreignKey,
  text,
  timestamp,
  unique,
  boolean,
  integer,
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
  },
  (table) => [unique("user_email_unique").on(table.email)]
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
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "instagram_integration_user_id_user_id_fk",
    }).onDelete("cascade"),
  ]
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