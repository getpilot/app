import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { id: v.id("user") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("user", args);
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("user"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
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
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const updateUserSettings = mutation({
  args: {
    id: v.id("user"),
    name: v.string(),
    email: v.string(),
    gender: v.optional(v.string()),
    image: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const updateOnboardingStep = mutation({
  args: {
    id: v.id("user"),
    updates: v.object({
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
    }),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: args.updatedAt,
    });
  },
});

export const completeOnboarding = mutation({
  args: {
    id: v.id("user"),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      onboarding_complete: true,
      updatedAt: args.updatedAt,
    });
  },
});

export const completeSidekickOnboarding = mutation({
  args: {
    id: v.id("user"),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      sidekick_onboarding_complete: true,
      updatedAt: args.updatedAt,
    });
  },
});

export const checkOnboardingStatus = query({
  args: { id: v.id("user") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return {
      onboarding_complete: user?.onboarding_complete || false,
    };
  },
});

export const checkSidekickOnboardingStatus = query({
  args: { id: v.id("user") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return {
      sidekick_onboarding_complete: user?.sidekick_onboarding_complete || false,
    };
  },
});