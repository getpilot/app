import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  user: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    gender: v.optional(v.string()),
    use_case: v.optional(v.array(v.string())),
    other_use_case: v.optional(v.string()),
    leads_per_month: v.optional(v.string()),
    active_platforms: v.optional(v.array(v.string())),
    other_platform: v.optional(v.string()),
    business_type: v.optional(v.string()),
    other_business_type: v.optional(v.string()),
    pilot_goal: v.optional(v.array(v.string())),
    current_tracking: v.optional(v.array(v.string())),
    other_tracking: v.optional(v.string()),
    main_offering: v.optional(v.string()),
    onboarding_complete: v.optional(v.boolean()),
    sidekick_onboarding_complete: v.optional(v.boolean()),
  }).index("email", ["email"]),

  session: defineTable({
    expiresAt: v.number(),
    token: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    userId: v.id("user"),
  })
    .index("token", ["token"])
    .index("user_id", ["userId"])
    .index("expires_at", ["expiresAt"]),

  account: defineTable({
    accountId: v.string(),
    providerId: v.string(),
    userId: v.id("user"),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("provider", ["providerId", "accountId"]),

  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("identifier", ["identifier"])
    .index("expires_at", ["expiresAt"]),

  instagramIntegration: defineTable({
    userId: v.id("user"),
    instagramUserId: v.string(),
    appScopedUserId: v.optional(v.string()),
    username: v.string(),
    accessToken: v.string(),
    expiresAt: v.number(),
    syncIntervalHours: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("instagram_user_id", ["instagramUserId"])
    .index("username", ["username"]),

  contact: defineTable({
    userId: v.id("user"),
    username: v.optional(v.string()),
    lastMessage: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    stage: v.optional(
      v.union(
        v.literal("new"),
        v.literal("lead"),
        v.literal("follow-up"),
        v.literal("ghosted")
      )
    ),
    sentiment: v.optional(
      v.union(
        v.literal("hot"),
        v.literal("warm"),
        v.literal("cold"),
        v.literal("ghosted"),
        v.literal("neutral")
      )
    ),
    leadScore: v.optional(v.number()),
    nextAction: v.optional(v.string()),
    leadValue: v.optional(v.number()),
    triggerMatched: v.optional(v.boolean()),
    followupNeeded: v.optional(v.boolean()),
    followupMessage: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("user_stage", ["userId", "stage"])
    .index("user_sentiment", ["userId", "sentiment"])
    .index("user_created_at", ["userId", "createdAt"])
    .index("user_last_message_at", ["userId", "lastMessageAt"])
    .index("user_lead_score", ["userId", "leadScore"]),

  contactTag: defineTable({
    contactId: v.id("contact"),
    tag: v.string(),
    createdAt: v.number(),
  })
    .index("contact_id", ["contactId"])
    .index("tag", ["tag"])
    .index("contact_tag", ["contactId", "tag"]),

  userOffer: defineTable({
    userId: v.id("user"),
    name: v.string(),
    content: v.string(),
    value: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("user_created_at", ["userId", "createdAt"]),

  userToneProfile: defineTable({
    userId: v.id("user"),
    toneType: v.union(
      v.literal("friendly"),
      v.literal("direct"),
      v.literal("like_me"),
      v.literal("custom")
    ),
    sampleText: v.optional(v.array(v.string())),
    sampleFiles: v.optional(v.array(v.string())),
    trainedEmbeddingId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("tone_type", ["toneType"]),

  userOfferLink: defineTable({
    userId: v.id("user"),
    type: v.union(
      v.literal("primary"),
      v.literal("calendar"),
      v.literal("notion"),
      v.literal("website")
    ),
    url: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("type", ["type"]),

  userFaq: defineTable({
    userId: v.id("user"),
    question: v.string(),
    answer: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("user_created_at", ["userId", "createdAt"]),

  sidekickSetting: defineTable({
    userId: v.id("user"),
    systemPrompt: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("user_id", ["userId"]),

  sidekickActionLog: defineTable({
    userId: v.id("user"),
    platform: v.literal("instagram"),
    threadId: v.string(),
    recipientId: v.string(),
    recipientUsername: v.optional(v.string()),
    action: v.literal("sent_reply"),
    text: v.string(),
    result: v.union(v.literal("sent"), v.literal("failed")),
    createdAt: v.number(),
    messageId: v.optional(v.string()),
  })
    .index("user_id", ["userId"])
    .index("user_created_at", ["userId", "createdAt"])
    .index("platform", ["platform"])
    .index("thread_id", ["threadId"])
    .index("recipient_id", ["recipientId"]),

  chatSession: defineTable({
    userId: v.id("user"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("user_created_at", ["userId", "createdAt"])
    .index("user_updated_at", ["userId", "updatedAt"]),

  chatMessage: defineTable({
    sessionId: v.id("chatSession"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("session_id", ["sessionId"])
    .index("session_created_at", ["sessionId", "createdAt"]),

  automation: defineTable({
    userId: v.id("user"),
    title: v.string(),
    description: v.optional(v.string()),
    triggerWord: v.string(),
    responseType: v.union(
      v.literal("fixed"),
      v.literal("ai_prompt"),
      v.literal("generic_template")
    ),
    responseContent: v.string(),
    isActive: v.optional(v.boolean()),
    triggerScope: v.optional(
      v.union(v.literal("dm"), v.literal("comment"), v.literal("both"))
    ),
    commentReplyCount: v.optional(v.number()),
    commentReplyText: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("user_active", ["userId", "isActive"])
    .index("trigger_word", ["triggerWord"])
    .index("user_trigger_word", ["userId", "triggerWord"])
    .index("user_created_at", ["userId", "createdAt"]),

  automationPost: defineTable({
    automationId: v.id("automation"),
    postId: v.string(),
    createdAt: v.number(),
  })
    .index("automation_id", ["automationId"])
    .index("post_id", ["postId"]),

  automationActionLog: defineTable({
    userId: v.id("user"),
    platform: v.literal("instagram"),
    threadId: v.string(),
    recipientId: v.string(),
    automationId: v.id("automation"),
    triggerWord: v.string(),
    action: v.union(
      v.literal("dm_automation_triggered"),
      v.literal("comment_automation_triggered"),
      v.literal("dm_and_comment_automation_triggered"),
      v.literal("sent_reply")
    ),
    text: v.optional(v.string()),
    messageId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("user_id", ["userId"])
    .index("automation_id", ["automationId"])
    .index("user_created_at", ["userId", "createdAt"])
    .index("platform", ["platform"])
    .index("thread_id", ["threadId"])
    .index("recipient_id", ["recipientId"]),
});