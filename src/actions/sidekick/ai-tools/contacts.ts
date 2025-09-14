"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { Id } from "../../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;
const toContactId = (id: string): Id<"contact"> => id as Id<"contact">;

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

    let contacts;
    if (stage && sentiment) {
      const stageContacts = await convex.query(
        api.contacts.getContactsByUserIdAndStage,
        {
          userId: toUserId(currentUser._id),
          stage,
        }
      );
      contacts = stageContacts.filter((c) => c.sentiment === sentiment);
    } else if (stage) {
      contacts = await convex.query(api.contacts.getContactsByUserIdAndStage, {
        userId: toUserId(currentUser._id),
        stage,
      });
    } else if (sentiment) {
      contacts = await convex.query(
        api.contacts.getContactsByUserIdAndSentiment,
        {
          userId: toUserId(currentUser._id),
          sentiment,
        }
      );
    } else {
      contacts = await convex.query(api.contacts.getContactsByUserId, {
        userId: toUserId(currentUser._id),
      });
    }

    if (sortBy === "lastMessageAt") {
      contacts = contacts.sort(
        (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
      );
    } else if (sortBy === "leadScore") {
      contacts = contacts.sort(
        (a, b) => (b.leadScore || 0) - (a.leadScore || 0)
      );
    } else {
      contacts = contacts.sort((a, b) => b.createdAt - a.createdAt);
    }

    contacts = contacts.slice(0, limit);

    return {
      success: true,
      contacts: contacts.map((c) => ({
        id: c._id,
        username: c.username,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt
          ? new Date(c.lastMessageAt).toISOString()
          : null,
        stage: c.stage,
        sentiment: c.sentiment,
        leadScore: c.leadScore,
        nextAction: c.nextAction,
        leadValue: c.leadValue,
        triggerMatched: c.triggerMatched,
        followupNeeded: c.followupNeeded,
        followupMessage: c.followupMessage,
        notes: c.notes,
        createdAt: new Date(c.createdAt).toISOString(),
        updatedAt: new Date(c.updatedAt).toISOString(),
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

    const contact = await convex.query(api.contacts.getContact, {
      id: toContactId(contactId),
    });

    if (!contact) {
      return { success: false, error: "Contact not found" };
    }

    return {
      success: true,
      contact: {
        id: contact._id,
        username: contact.username,
        lastMessage: contact.lastMessage,
        lastMessageAt: contact.lastMessageAt
          ? new Date(contact.lastMessageAt).toISOString()
          : null,
        stage: contact.stage,
        sentiment: contact.sentiment,
        leadScore: contact.leadScore,
        nextAction: contact.nextAction,
        leadValue: contact.leadValue,
        triggerMatched: contact.triggerMatched,
        followupNeeded: contact.followupNeeded,
        followupMessage: contact.followupMessage,
        notes: contact.notes,
        createdAt: new Date(contact.createdAt).toISOString(),
        updatedAt: new Date(contact.updatedAt).toISOString(),
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

    await convex.mutation(api.contacts.updateContact, {
      id: toContactId(contactId),
      stage: fields.stage,
      sentiment: fields.sentiment,
      leadScore: fields.leadScore,
      nextAction: fields.nextAction,
      leadValue: fields.leadValue,
      notes: fields.notes,
      updatedAt: Date.now(),
    });

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

    await convex.mutation(api.contact_tags.createContactTag, {
      contactId: toContactId(contactId),
      tag,
      createdAt: Date.now(),
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

    await convex.mutation(api.contact_tags.deleteContactTagByContactAndTag, {
      contactId: toContactId(contactId),
      tag,
    });

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

    const tags = await convex.query(
      api.contact_tags.getContactTagsByContactId,
      {
        contactId: toContactId(contactId),
      }
    );

    return {
      success: true,
      tags: tags.map((t: any) => ({
        id: t._id,
        tag: t.tag,
        createdAt: new Date(t.createdAt).toISOString(),
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

    const allContacts = await convex.query(api.contacts.getContactsByUserId, {
      userId: toUserId(currentUser._id),
    });

    const contacts = allContacts
      .filter(
        (c) =>
          c.username?.toLowerCase().includes(query.toLowerCase()) ||
          c.notes?.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);

    return {
      success: true,
      contacts: contacts.map((c) => ({
        id: c._id,
        username: c.username,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt
          ? new Date(c.lastMessageAt).toISOString()
          : null,
        stage: c.stage,
        sentiment: c.sentiment,
        leadScore: c.leadScore,
        nextAction: c.nextAction,
        leadValue: c.leadValue,
        triggerMatched: c.triggerMatched,
        followupNeeded: c.followupNeeded,
        followupMessage: c.followupMessage,
        notes: c.notes,
        createdAt: new Date(c.createdAt).toISOString(),
        updatedAt: new Date(c.updatedAt).toISOString(),
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