import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAutomationsByUserId = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automation")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getActiveAutomationsByUserId = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automation")
      .withIndex("user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
  },
});

export const getAutomationByTriggerWord = query({
  args: {
    userId: v.id("user"),
    triggerWord: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automation")
      .withIndex("user_trigger_word", (q) =>
        q.eq("userId", args.userId).eq("triggerWord", args.triggerWord)
      )
      .first();
  },
});

export const getAutomation = query({
  args: { id: v.id("automation") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createAutomation = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("automation", args);
  },
});

export const updateAutomation = mutation({
  args: {
    id: v.id("automation"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    triggerWord: v.optional(v.string()),
    responseType: v.optional(
      v.union(
        v.literal("fixed"),
        v.literal("ai_prompt"),
        v.literal("generic_template")
      )
    ),
    responseContent: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    triggerScope: v.optional(
      v.union(v.literal("dm"), v.literal("comment"), v.literal("both"))
    ),
    commentReplyCount: v.optional(v.number()),
    commentReplyText: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteAutomation = mutation({
  args: { id: v.id("automation") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const toggleAutomation = mutation({
  args: {
    id: v.id("automation"),
    isActive: v.boolean(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: args.updatedAt,
    });
  },
});

export const getAutomationActionLogs = query({
  args: { automationId: v.id("automation") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automationActionLog")
      .withIndex("automation_id", (q) =>
        q.eq("automationId", args.automationId)
      )
      .collect();
  },
});

export const createAutomationActionLog = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("automationActionLog", args);
  },
});

export const getRecentAutomationLogs = query({
  args: {
    userId: v.id("user"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit || 25), 100);

    return await ctx.db
      .query("automationActionLog")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const getActiveAutomationsByUserIdAndScope = query({
  args: {
    userId: v.id("user"),
    scope: v.optional(
      v.union(v.literal("dm"), v.literal("comment"), v.literal("both"))
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let query = ctx.db
      .query("automation")
      .withIndex("user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      );

    const automations = await query.collect();

    return automations.filter((automation) => {
      if (automation.expiresAt && automation.expiresAt < now) {
        return false;
      }

      if (args.scope) {
        const automationScope = automation.triggerScope || "dm";
        return automationScope === "both" || automationScope === args.scope;
      }

      return true;
    });
  },
});

export const checkTriggerMatch = query({
  args: {
    userId: v.id("user"),
    messageText: v.string(),
    scope: v.optional(
      v.union(v.literal("dm"), v.literal("comment"), v.literal("both"))
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const automations = await ctx.db
      .query("automation")
      .withIndex("user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    for (const automation of automations) {
      if (automation.expiresAt && automation.expiresAt < now) {
        continue;
      }

      const trigger = automation.triggerWord?.toLowerCase() ?? "";
      if (!trigger) continue;

      const automationScope = automation.triggerScope || "dm";
      const scopeMatches =
        automationScope === "both" ||
        automationScope === args.scope ||
        (args.scope === "dm" && !automationScope);

      if (scopeMatches && args.messageText.toLowerCase().includes(trigger)) {
        return automation;
      }
    }

    return null;
  },
});