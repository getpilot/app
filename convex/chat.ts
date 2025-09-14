import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getChatSessions = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatSession")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getChatSession = query({
  args: { id: v.id("chatSession") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createChatSession = mutation({
  args: {
    userId: v.id("user"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatSession", args);
  },
});

export const updateChatSession = mutation({
  args: {
    id: v.id("chatSession"),
    title: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteChatSession = mutation({
  args: { id: v.id("chatSession") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const getChatMessages = query({
  args: { sessionId: v.id("chatSession") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessage")
      .withIndex("session_id", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

export const getChatMessage = query({
  args: { id: v.id("chatMessage") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createChatMessage = mutation({
  args: {
    sessionId: v.id("chatSession"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessage", args);
  },
});

export const updateChatMessage = mutation({
  args: {
    id: v.id("chatMessage"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { content: args.content });
  },
});

export const deleteChatMessage = mutation({
  args: { id: v.id("chatMessage") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const getChatMessagesSorted = query({
  args: { sessionId: v.id("chatSession") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessage")
      .withIndex("session_created_at", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});