import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getContactTagsByContactId = query({
  args: { contactId: v.id("contact") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contactTag")
      .withIndex("contact_id", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

export const getContactTagsByTag = query({
  args: { tag: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contactTag")
      .withIndex("tag", (q) => q.eq("tag", args.tag))
      .collect();
  },
});

export const getContactTag = query({
  args: {
    contactId: v.id("contact"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contactTag")
      .withIndex("contact_tag", (q) =>
        q.eq("contactId", args.contactId).eq("tag", args.tag)
      )
      .first();
  },
});

export const createContactTag = mutation({
  args: {
    contactId: v.id("contact"),
    tag: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contactTag", args);
  },
});

export const deleteContactTag = mutation({
  args: { id: v.id("contactTag") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const deleteContactTagByContactAndTag = mutation({
  args: {
    contactId: v.id("contact"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const contactTag = await ctx.db
      .query("contactTag")
      .withIndex("contact_tag", (q) =>
        q.eq("contactId", args.contactId).eq("tag", args.tag)
      )
      .first();

    if (contactTag) {
      await ctx.db.delete(contactTag._id);
      return true;
    }
    return false;
  },
});

export const deleteAllContactTags = mutation({
  args: { contactId: v.id("contact") },
  handler: async (ctx, args) => {
    const tags = await ctx.db
      .query("contactTag")
      .withIndex("contact_id", (q) => q.eq("contactId", args.contactId))
      .collect();

    for (const tag of tags) {
      await ctx.db.delete(tag._id);
    }

    return tags.length;
  },
});