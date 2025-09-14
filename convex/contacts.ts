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

export const getContactsByUserIdAndFollowupNeeded = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contact")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("followupNeeded"), true))
      .collect();
  },
});

export const getContactsLastUpdatedAt = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contact")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);

    return contacts[0]?.updatedAt || null;
  },
});

export const hasContactsUpdatedSince = query({
  args: {
    userId: v.id("user"),
    sinceTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contact")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("updatedAt"), args.sinceTimestamp))
      .take(1);

    return contacts.length > 0;
  },
});

export const getContactsByIds = query({
  args: {
    userId: v.id("user"),
    contactIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const contacts = [];
    for (const contactId of args.contactIds) {
      const contact = await ctx.db.get(contactId as any);
      if (contact && "userId" in contact && contact.userId === args.userId) {
        contacts.push(contact);
      }
    }
    return contacts;
  },
});

export const updateContactFollowupStatus = mutation({
  args: {
    id: v.id("contact"),
    followupNeeded: v.boolean(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      followupNeeded: args.followupNeeded,
      updatedAt: args.updatedAt,
    });
  },
});

export const updateContactAfterFollowUp = mutation({
  args: {
    id: v.id("contact"),
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
    leadValue: v.optional(v.number()),
    nextAction: v.optional(v.string()),
    followupNeeded: v.boolean(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const updateContactFollowupMessage = mutation({
  args: {
    id: v.id("contact"),
    followupMessage: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      followupMessage: args.followupMessage,
      updatedAt: args.updatedAt,
    });
  },
});