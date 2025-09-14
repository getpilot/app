import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  user: defineTable({
    id: v.string(),
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
  })
    .index("by_email", ["email"])
    .index("by_id", ["id"]),

  session: defineTable({
    id: v.string(),
    expiresAt: v.number(),
    token: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    userId: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_user_id", ["userId"])
    .index("by_expires_at", ["expiresAt"]),

  account: defineTable({
    id: v.string(),
    accountId: v.string(),
    providerId: v.string(),
    userId: v.string(),
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
    .index("by_user_id", ["userId"])
    .index("by_provider", ["providerId", "accountId"]),

  verification: defineTable({
    id: v.string(),
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_identifier", ["identifier"])
    .index("by_expires_at", ["expiresAt"]),

  instagramIntegration: defineTable({
    id: v.string(),
    userId: v.string(),
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
    .index("by_user_id", ["userId"])
    .index("by_instagram_user_id", ["instagramUserId"])
    .index("by_username", ["username"]),

  contact: defineTable({
    id: v.string(),
    userId: v.string(),
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
    .index("by_user_id", ["userId"])
    .index("by_user_stage", ["userId", "stage"])
    .index("by_user_sentiment", ["userId", "sentiment"])
    .index("by_user_created_at", ["userId", "createdAt"])
    .index("by_user_last_message_at", ["userId", "lastMessageAt"])
    .index("by_user_lead_score", ["userId", "leadScore"]),

  contactTag: defineTable({
    id: v.string(),
    contactId: v.string(),
    tag: v.string(),
    createdAt: v.number(),
  })
    .index("by_contact_id", ["contactId"])
    .index("by_tag", ["tag"])
    .index("by_contact_tag", ["contactId", "tag"]),

  userOffer: defineTable({
    id: v.string(),
    userId: v.string(),
    name: v.string(),
    content: v.string(),
    value: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_created_at", ["userId", "createdAt"]),

  userToneProfile: defineTable({
    id: v.string(),
    userId: v.string(),
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
    .index("by_user_id", ["userId"])
    .index("by_tone_type", ["toneType"]),

  userOfferLink: defineTable({
    id: v.string(),
    userId: v.string(),
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
    .index("by_user_id", ["userId"])
    .index("by_type", ["type"]),

  userFaq: defineTable({
    id: v.string(),
    userId: v.string(),
    question: v.string(),
    answer: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_created_at", ["userId", "createdAt"]),

  sidekickSetting: defineTable({
    userId: v.string(),
    systemPrompt: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  sidekickActionLog: defineTable({
    id: v.string(),
    userId: v.string(),
    platform: v.literal("instagram"),
    threadId: v.string(),
    recipientId: v.string(),
    action: v.literal("sent_reply"),
    text: v.string(),
    result: v.union(v.literal("sent"), v.literal("failed")),
    createdAt: v.number(),
    messageId: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_created_at", ["userId", "createdAt"])
    .index("by_platform", ["platform"])
    .index("by_thread_id", ["threadId"])
    .index("by_recipient_id", ["recipientId"]),

  chatSession: defineTable({
    id: v.string(),
    userId: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_created_at", ["userId", "createdAt"])
    .index("by_user_updated_at", ["userId", "updatedAt"]),

  chatMessage: defineTable({
    id: v.string(),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_session_id", ["sessionId"])
    .index("by_session_created_at", ["sessionId", "createdAt"]),

  automation: defineTable({
    id: v.string(),
    userId: v.string(),
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
    .index("by_user_id", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_trigger_word", ["triggerWord"])
    .index("by_user_trigger_word", ["userId", "triggerWord"])
    .index("by_user_created_at", ["userId", "createdAt"]),

  automationPost: defineTable({
    id: v.string(),
    automationId: v.string(),
    postId: v.string(),
    createdAt: v.number(),
  })
    .index("by_automation_id", ["automationId"])
    .index("by_post_id", ["postId"]),

  automationActionLog: defineTable({
    id: v.string(),
    userId: v.string(),
    platform: v.literal("instagram"),
    threadId: v.string(),
    recipientId: v.string(),
    automationId: v.string(),
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
    .index("by_user_id", ["userId"])
    .index("by_automation_id", ["automationId"])
    .index("by_user_created_at", ["userId", "createdAt"])
    .index("by_platform", ["platform"])
    .index("by_thread_id", ["threadId"])
    .index("by_recipient_id", ["recipientId"]),
});