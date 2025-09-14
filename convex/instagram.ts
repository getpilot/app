import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getInstagramIntegrationByUserId = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("instagramIntegration")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getInstagramIntegrationByInstagramUserId = query({
  args: { instagramUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("instagramIntegration")
      .withIndex("instagram_user_id", (q) =>
        q.eq("instagramUserId", args.instagramUserId)
      )
      .first();
  },
});

export const getInstagramIntegrationByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("instagramIntegration")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const createInstagramIntegration = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("instagramIntegration", args);
  },
});

export const updateInstagramIntegration = mutation({
  args: {
    id: v.id("instagramIntegration"),
    instagramUserId: v.optional(v.string()),
    appScopedUserId: v.optional(v.string()),
    username: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    syncIntervalHours: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteInstagramIntegration = mutation({
  args: { id: v.id("instagramIntegration") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const updateLastSyncedAt = mutation({
  args: {
    id: v.id("instagramIntegration"),
    lastSyncedAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      lastSyncedAt: args.lastSyncedAt,
      updatedAt: args.updatedAt,
    });
  },
});

export const updateSyncInterval = mutation({
  args: {
    id: v.id("instagramIntegration"),
    syncIntervalHours: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      syncIntervalHours: args.syncIntervalHours,
      updatedAt: args.updatedAt,
    });
  },
});

export const upsertInstagramIntegration = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("instagramIntegration")
      .withIndex("user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        instagramUserId: args.instagramUserId,
        appScopedUserId: args.appScopedUserId,
        username: args.username,
        accessToken: args.accessToken,
        expiresAt: args.expiresAt,
        syncIntervalHours: args.syncIntervalHours,
        lastSyncedAt: args.lastSyncedAt,
        updatedAt: args.updatedAt,
      });
    } else {
      return await ctx.db.insert("instagramIntegration", args);
    }
  },
});

export const getAllInstagramIntegrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("instagramIntegration").collect();
  },
});

export const getLatestIntegration = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("instagramIntegration")
      .order("desc")
      .first();
  },
});