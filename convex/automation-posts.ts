import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAutomationPostsByAutomationId = query({
  args: { automationId: v.id("automation") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automationPost")
      .withIndex("automation_id", (q) => q.eq("automationId", args.automationId))
      .collect();
  },
});

export const getAutomationPostByPostId = query({
  args: { postId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automationPost")
      .withIndex("post_id", (q) => q.eq("postId", args.postId))
      .first();
  },
});

export const getAutomationPost = query({
  args: { id: v.id("automationPost") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createAutomationPost = mutation({
  args: {
    automationId: v.id("automation"),
    postId: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("automationPost", args);
  },
});

export const deleteAutomationPost = mutation({
  args: { id: v.id("automationPost") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const deleteAutomationPostsByAutomationId = mutation({
  args: { automationId: v.id("automation") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("automationPost")
      .withIndex("automation_id", (q) => q.eq("automationId", args.automationId))
      .collect();
    
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }
    
    return posts.length;
  },
});