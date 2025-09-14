import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSidekickSetting = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sidekickSetting")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const createSidekickSetting = mutation({
  args: {
    userId: v.id("user"),
    systemPrompt: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sidekickSetting", args);
  },
});

export const updateSidekickSetting = mutation({
  args: {
    userId: v.id("user"),
    systemPrompt: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("sidekickSetting")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!setting) {
      throw new Error("Sidekick setting not found");
    }

    return await ctx.db.patch(setting._id, {
      systemPrompt: args.systemPrompt,
      updatedAt: args.updatedAt,
    });
  },
});

export const getSidekickActionLogs = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sidekickActionLog")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createSidekickActionLog = mutation({
  args: {
    userId: v.id("user"),
    platform: v.literal("instagram"),
    threadId: v.string(),
    recipientId: v.string(),
    action: v.literal("sent_reply"),
    text: v.string(),
    result: v.union(v.literal("sent"), v.literal("failed")),
    createdAt: v.number(),
    messageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sidekickActionLog", args);
  },
});

export const getUserOffers = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userOffer")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createUserOffer = mutation({
  args: {
    userId: v.id("user"),
    name: v.string(),
    content: v.string(),
    value: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userOffer", args);
  },
});

export const updateUserOffer = mutation({
  args: {
    id: v.id("userOffer"),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
    value: v.optional(v.number()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteUserOffer = mutation({
  args: { id: v.id("userOffer") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const getUserToneProfile = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userToneProfile")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const createUserToneProfile = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userToneProfile", args);
  },
});

export const updateUserToneProfile = mutation({
  args: {
    id: v.id("userToneProfile"),
    toneType: v.optional(
      v.union(
        v.literal("friendly"),
        v.literal("direct"),
        v.literal("like_me"),
        v.literal("custom")
      )
    ),
    sampleText: v.optional(v.array(v.string())),
    sampleFiles: v.optional(v.array(v.string())),
    trainedEmbeddingId: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const getUserOfferLinks = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userOfferLink")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createUserOfferLink = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userOfferLink", args);
  },
});

export const updateUserOfferLink = mutation({
  args: {
    id: v.id("userOfferLink"),
    type: v.optional(
      v.union(
        v.literal("primary"),
        v.literal("calendar"),
        v.literal("notion"),
        v.literal("website")
      )
    ),
    url: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteUserOfferLink = mutation({
  args: { id: v.id("userOfferLink") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const getUserFaqs = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userFaq")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createUserFaq = mutation({
  args: {
    userId: v.id("user"),
    question: v.string(),
    answer: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userFaq", args);
  },
});

export const updateUserFaq = mutation({
  args: {
    id: v.id("userFaq"),
    question: v.optional(v.string()),
    answer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteUserFaq = mutation({
  args: { id: v.id("userFaq") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});