"use server";

import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { contact, contactTag } from "@/lib/db/schema";
import { and, desc, asc, eq, like, or } from "drizzle-orm";

export async function listContacts(
  stage?: "new" | "lead" | "follow-up" | "ghosted",
  sentiment?: "hot" | "warm" | "cold" | "ghosted" | "neutral",
  limit: number = 50,
  sortBy: "createdAt" | "lastMessageAt" | "leadScore" = "createdAt"
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const conditions = [eq(contact.userId, currentUser.id)];

    if (stage) {
      conditions.push(eq(contact.stage, stage));
    }

    if (sentiment) {
      conditions.push(eq(contact.sentiment, sentiment));
    }

    const orderBy =
      sortBy === "createdAt"
        ? desc(contact.createdAt)
        : sortBy === "lastMessageAt"
        ? desc(contact.lastMessageAt)
        : desc(contact.leadScore);

    const contacts = await db
      .select()
      .from(contact)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit);

    return {
      success: true,
      contacts: contacts.map((c) => ({
        id: c.id,
        username: c.username,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt ? String(c.lastMessageAt) : null,
        stage: c.stage,
        sentiment: c.sentiment,
        leadScore: c.leadScore,
        nextAction: c.nextAction,
        leadValue: c.leadValue,
        triggerMatched: c.triggerMatched,
        followupNeeded: c.followupNeeded,
        followupMessage: c.followupMessage,
        notes: c.notes,
        createdAt: String(c.createdAt),
        updatedAt: String(c.updatedAt),
      })),
    };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch contacts",
    };
  }
}

export async function getContact(contactId: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const contactResult = await db
      .select()
      .from(contact)
      .where(and(eq(contact.id, contactId), eq(contact.userId, currentUser.id)))
      .limit(1);

    if (contactResult.length === 0) {
      return { success: false, error: "Contact not found" };
    }

    const c = contactResult[0];
    return {
      success: true,
      contact: {
        id: c.id,
        username: c.username,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt ? String(c.lastMessageAt) : null,
        stage: c.stage,
        sentiment: c.sentiment,
        leadScore: c.leadScore,
        nextAction: c.nextAction,
        leadValue: c.leadValue,
        triggerMatched: c.triggerMatched,
        followupNeeded: c.followupNeeded,
        followupMessage: c.followupMessage,
        notes: c.notes,
        createdAt: String(c.createdAt),
        updatedAt: String(c.updatedAt),
      },
    };
  } catch (error) {
    console.error("Error fetching contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch contact",
    };
  }
}

export async function updateContact(
  contactId: string,
  fields: {
    stage?: "new" | "lead" | "follow-up" | "ghosted";
    sentiment?: "hot" | "warm" | "cold" | "ghosted" | "neutral";
    leadScore?: number;
    nextAction?: string;
    leadValue?: number;
    notes?: string;
  }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // First check if contact exists and belongs to user
    const existingContact = await db
      .select()
      .from(contact)
      .where(and(eq(contact.id, contactId), eq(contact.userId, currentUser.id)))
      .limit(1);

    if (existingContact.length === 0) {
      return { success: false, error: "Contact not found" };
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (fields.stage !== undefined) updateData.stage = fields.stage;
    if (fields.sentiment !== undefined) updateData.sentiment = fields.sentiment;
    if (fields.leadScore !== undefined) updateData.leadScore = fields.leadScore;
    if (fields.nextAction !== undefined)
      updateData.nextAction = fields.nextAction;
    if (fields.leadValue !== undefined) updateData.leadValue = fields.leadValue;
    if (fields.notes !== undefined) updateData.notes = fields.notes;

    await db
      .update(contact)
      .set(updateData)
      .where(
        and(eq(contact.id, contactId), eq(contact.userId, currentUser.id))
      );

    return { success: true };
  } catch (error) {
    console.error("Error updating contact:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update contact",
    };
  }
}

export async function addContactTag(contactId: string, tag: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // First check if contact exists and belongs to user
    const existingContact = await db
      .select()
      .from(contact)
      .where(and(eq(contact.id, contactId), eq(contact.userId, currentUser.id)))
      .limit(1);

    if (existingContact.length === 0) {
      return { success: false, error: "Contact not found" };
    }

    // Check if tag already exists
    const existingTag = await db
      .select()
      .from(contactTag)
      .where(and(eq(contactTag.contactId, contactId), eq(contactTag.tag, tag)))
      .limit(1);

    if (existingTag.length > 0) {
      return { success: false, error: "Tag already exists for this contact" };
    }

    await db.insert(contactTag).values({
      id: crypto.randomUUID(),
      contactId,
      tag,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding contact tag:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add contact tag",
    };
  }
}

export async function removeContactTag(contactId: string, tag: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // First check if contact exists and belongs to user
    const existingContact = await db
      .select()
      .from(contact)
      .where(and(eq(contact.id, contactId), eq(contact.userId, currentUser.id)))
      .limit(1);

    if (existingContact.length === 0) {
      return { success: false, error: "Contact not found" };
    }

    await db
      .delete(contactTag)
      .where(and(eq(contactTag.contactId, contactId), eq(contactTag.tag, tag)));

    return { success: true };
  } catch (error) {
    console.error("Error removing contact tag:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove contact tag",
    };
  }
}

export async function getContactTags(contactId: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // First check if contact exists and belongs to user
    const existingContact = await db
      .select()
      .from(contact)
      .where(and(eq(contact.id, contactId), eq(contact.userId, currentUser.id)))
      .limit(1);

    if (existingContact.length === 0) {
      return { success: false, error: "Contact not found" };
    }

    const tags = await db
      .select()
      .from(contactTag)
      .where(eq(contactTag.contactId, contactId))
      .orderBy(asc(contactTag.tag));

    return {
      success: true,
      tags: tags.map((t) => ({
        id: t.id,
        tag: t.tag,
        createdAt: String(t.createdAt),
      })),
    };
  } catch (error) {
    console.error("Error fetching contact tags:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch contact tags",
    };
  }
}

export async function searchContacts(query: string, limit: number = 20) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const contacts = await db
      .select()
      .from(contact)
      .where(
        and(
          eq(contact.userId, currentUser.id),
          or(
            like(contact.username, `%${query}%`),
            like(contact.notes, `%${query}%`)
          )
        )
      )
      .orderBy(desc(contact.updatedAt))
      .limit(limit);

    return {
      success: true,
      contacts: contacts.map((c) => ({
        id: c.id,
        username: c.username,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt ? String(c.lastMessageAt) : null,
        stage: c.stage,
        sentiment: c.sentiment,
        leadScore: c.leadScore,
        nextAction: c.nextAction,
        leadValue: c.leadValue,
        triggerMatched: c.triggerMatched,
        followupNeeded: c.followupNeeded,
        followupMessage: c.followupMessage,
        notes: c.notes,
        createdAt: String(c.createdAt),
        updatedAt: String(c.updatedAt),
      })),
    };
  } catch (error) {
    console.error("Error searching contacts:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search contacts",
    };
  }
}