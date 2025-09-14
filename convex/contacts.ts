import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getContactsByUserId = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contact")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getContactsByUserIdAndStage = query({
  args: {
    userId: v.id("user"),
    stage: v.union(
      v.literal("new"),
      v.literal("lead"),
      v.literal("follow-up"),
      v.literal("ghosted")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contact")
      .withIndex("user_stage", (q) =>
        q.eq("userId", args.userId).eq("stage", args.stage)
      )
      .collect();
  },
});

export const getContactsByUserIdAndSentiment = query({
  args: {
    userId: v.id("user"),
    sentiment: v.union(
      v.literal("hot"),
      v.literal("warm"),
      v.literal("cold"),
      v.literal("ghosted"),
      v.literal("neutral")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contact")
      .withIndex("user_sentiment", (q) =>
        q.eq("userId", args.userId).eq("sentiment", args.sentiment)
      )
      .collect();
  },
});

export const getContact = query({
  args: { id: v.id("contact") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createContact = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contact", args);
  },
});

export const updateContact = mutation({
  args: {
    id: v.id("contact"),
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
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteContact = mutation({
  args: { id: v.id("contact") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const getContactsByUserIdSorted = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contact")
      .withIndex("user_created_at", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getContactsByUserIdSortedByLastMessage = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contact")
      .withIndex("user_last_message_at", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});