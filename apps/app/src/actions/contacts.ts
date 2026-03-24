"use server";

import { getRLSDb, getUser } from "@/lib/auth-utils";
import { unstable_cache as nextCache, revalidateTag } from "next/cache";
import {
  contact,
  instagramIntegration,
  contactTag,
} from "@pilot/db/schema";
import { eq, and, inArray, desc, asc, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";
import {
  generateText,
  geminiModel,
} from "@pilot/core/ai/model";
import {
  InstagramContact,
  InstagramMessage,
  ContactField,
} from "@pilot/types/instagram";
import {
  DEFAULT_SIDEKICK_PROMPT,
  getBusinessKnowledgeSnapshotByUserId,
  getPersonalizedFollowUpPrompt,
} from "@pilot/core/sidekick/personalization";
import {
  buildKnowledgeFallbackText,
  buildToneGuidance,
  formatMemoryContext,
  getContactContainerTag,
  getKnowledgeContainerTag,
  getMemoryProfile,
  searchMemory,
} from "@pilot/core/memory/supermemory";
import { fetchAndStoreInstagramContacts as fetchAndStoreInstagramContactsCore } from "@pilot/core/contacts/sync";
import { sanitizeText } from "@/lib/utils";
import {
  assertBillingAllowed,
  BillingLimitError,
  getBillingStatus,
} from "@/lib/billing/enforce";
import {
  fetchConversationMessagesForSync as fetchInstagramConversationMessagesForSync,
} from "@pilot/instagram";

const DEFAULT_MESSAGE_LIMIT = 10;

export async function fetchContacts(): Promise<InstagramContact[]> {
  try {
    console.log("Starting to fetch contacts");
    const user = await getUser();
    if (!user) {
      console.log("No authenticated user found");
      return [];
    }

    const db = await getRLSDb();
    console.log("Fetching contacts from DB");
    const contacts = await db.query.contact.findMany({
      where: eq(contact.userId, user.id),
    });
    console.log(`Found ${contacts.length} contacts in the database`);

    const contactIds = contacts.map((c) => c.id);
    const tagsMap = await fetchContactTagsForContacts(contactIds);

    return contacts.map((c) => ({
      id: c.id,
      name: c.username || "Unknown",
      lastMessage: c.lastMessage || undefined,
      timestamp: c.lastMessageAt?.toISOString(),
      stage: c.stage || undefined,
      sentiment: c.sentiment || undefined,
      notes: c.notes || undefined,
      leadScore: c.leadScore || undefined,
      nextAction: c.nextAction || undefined,
      leadValue: c.leadValue || undefined,
      requiresHumanResponse: c.requiresHumanResponse || undefined,
      humanResponseSetAt: c.humanResponseSetAt?.toISOString(),
      tags: tagsMap[c.id] || [],
    }));
  } catch (error) {
    console.error("Error fetching Instagram contacts:", error);
    return [];
  }
}

export async function fetchFollowUpContacts(): Promise<InstagramContact[]> {
  try {
    console.log("Starting to fetch follow-up contacts");
    const user = await getUser();
    if (!user) {
      console.log("No authenticated user found");
      return [];
    }

    console.log("Fetching contacts that need follow-up from DB");
    const db = await getRLSDb();
    const contacts = await db.query.contact.findMany({
      where: and(eq(contact.userId, user.id), eq(contact.followupNeeded, true)),
    });
    console.log(`Found ${contacts.length} contacts needing follow-up`);

    return contacts.map((c) => ({
      id: c.id,
      name: c.username || "Unknown",
      lastMessage: c.lastMessage || undefined,
      timestamp: c.lastMessageAt?.toISOString(),
      stage: c.stage || undefined,
      sentiment: c.sentiment || undefined,
      notes: c.notes || undefined,
      leadScore: c.leadScore || undefined,
      nextAction: c.nextAction || undefined,
      leadValue: c.leadValue || undefined,
      followupMessage: c.followupMessage || undefined,
      requiresHumanResponse: c.requiresHumanResponse || undefined,
      humanResponseSetAt: c.humanResponseSetAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching follow-up contacts:", error);
    return [];
  }
}

export async function fetchHRNContacts(): Promise<InstagramContact[]> {
  try {
    console.log("Starting to fetch HRN contacts");
    const user = await getUser();
    if (!user) {
      console.log("No authenticated user found");
      return [];
    }

    console.log("Fetching HRN contacts from DB");
    const db = await getRLSDb();
    const contacts = await db.query.contact.findMany({
      where: and(
        eq(contact.userId, user.id),
        eq(contact.requiresHumanResponse, true),
      ),
      orderBy: desc(contact.humanResponseSetAt ?? contact.updatedAt),
    });
    console.log(`Found ${contacts.length} HRN contacts`);

    return contacts.map((c) => ({
      id: c.id,
      name: c.username || "Unknown",
      lastMessage: c.lastMessage || undefined,
      timestamp: c.lastMessageAt?.toISOString(),
      stage: c.stage || undefined,
      sentiment: c.sentiment || undefined,
      notes: c.notes || undefined,
      leadScore: c.leadScore || undefined,
      nextAction: c.nextAction || undefined,
      leadValue: c.leadValue || undefined,
      requiresHumanResponse: c.requiresHumanResponse || undefined,
      humanResponseSetAt: c.humanResponseSetAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching HRN contacts:", error);
    return [];
  }
}

async function updateContactField(
  contactId: string,
  field: ContactField,
  value: string,
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await assertBillingAllowed(user.id, "contact:mutate");

    const db = await getRLSDb();
    const existingContact = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.userId, user.id)),
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found or unauthorized" };
    }

    const updateData = {
      updatedAt: new Date(),
    } as Record<string, unknown>;

    updateData[field] = value;

    await db
      .update(contact)
      .set(updateData)
      .where(and(eq(contact.id, contactId), eq(contact.userId, user.id)));

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return { success: false, error: error.message };
    }

    console.error(`Error updating contact ${field}:`, error);
    return { success: false, error: `Failed to update contact ${field}` };
  }
}

export async function updateContactStage(
  contactId: string,
  stage: "new" | "lead" | "follow-up" | "ghosted",
) {
  return updateContactField(contactId, "stage", stage);
}

export async function updateContactSentiment(
  contactId: string,
  sentiment: "hot" | "warm" | "cold" | "ghosted" | "neutral",
) {
  return updateContactField(contactId, "sentiment", sentiment);
}

export async function updateContactNotes(contactId: string, notes: string) {
  return updateContactField(contactId, "notes", notes);
}

export async function updateContactHRNState(
  contactId: string,
  opts: { requiresHumanResponse: boolean },
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await assertBillingAllowed(user.id, "contact:mutate");

    const db = await getRLSDb();
    const existingContact = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.userId, user.id)),
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found or unauthorized" };
    }

    const now = new Date();
    const requiresHumanResponse = !!opts.requiresHumanResponse;

    await db
      .update(contact)
      .set({
        requiresHumanResponse,
        humanResponseSetAt: requiresHumanResponse ? now : null,
        updatedAt: now,
      })
      .where(and(eq(contact.id, contactId), eq(contact.userId, user.id)));

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return { success: false, error: error.message };
    }

    console.error("Error updating HRN state:", error);
    return { success: false, error: "Failed to update HRN state" };
  }
}

export async function updateContactFollowUpStatus(
  contactId: string,
  followupNeeded: boolean,
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await assertBillingAllowed(user.id, "contact:mutate");

    const db = await getRLSDb();
    const existingContact = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.userId, user.id)),
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found or unauthorized" };
    }

    await db
      .update(contact)
      .set({
        followupNeeded,
        updatedAt: new Date(),
      })
      .where(and(eq(contact.id, contactId), eq(contact.userId, user.id)));

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return { success: false, error: error.message };
    }

    console.error("Error updating contact follow-up status:", error);
    return {
      success: false,
      error: "Failed to update contact follow-up status",
    };
  }
}

export async function updateContactAfterFollowUp(
  contactId: string,
  updates: {
    stage?: "new" | "lead" | "follow-up" | "ghosted";
    sentiment?: "hot" | "warm" | "cold" | "ghosted" | "neutral";
    leadScore?: number;
    leadValue?: number;
    nextAction?: string;
  },
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await assertBillingAllowed(user.id, "contact:mutate");

    const db = await getRLSDb();
    const existingContact = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.userId, user.id)),
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found or unauthorized" };
    }

    await db
      .update(contact)
      .set({
        ...updates,
        followupNeeded: false,
        updatedAt: new Date(),
      })
      .where(and(eq(contact.id, contactId), eq(contact.userId, user.id)));

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return { success: false, error: error.message };
    }

    console.error("Error updating contact after follow-up:", error);
    return {
      success: false,
      error: "Failed to update contact after follow-up",
    };
  }
}

export async function addContactTagAction(contactId: string, tag: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await assertBillingAllowed(user.id, "contact:mutate");

    const db = await getRLSDb();
    const existing = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.userId, user.id)),
    });
    if (!existing) return { success: false, error: "Contact not found" };

    const MAX_TAG_LENGTH = 24;
    const normalized = tag.trim().toLowerCase();
    if (normalized.length === 0) {
      return { success: false, error: "Tag is required" };
    }
    if (normalized.length > MAX_TAG_LENGTH) {
      return {
        success: false,
        error: `Tag too long (max ${MAX_TAG_LENGTH} characters)`,
      };
    }

    const duplicate = await db
      .select()
      .from(contactTag)
      .where(
        and(
          eq(contactTag.contactId, contactId),
          eq(contactTag.userId, user.id),
          eq(contactTag.tag, normalized),
        ),
      )
      .limit(1);
    if (duplicate.length > 0) {
      return { success: false, error: "Tag already exists for this contact" };
    }

    await db.insert(contactTag).values({
      id: crypto.randomUUID(),
      userId: user.id,
      contactId,
      tag: normalized,
      createdAt: new Date(),
    });

    revalidateTag(`user-tags-${user.id}`, "max");
    return { success: true };
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return { success: false, error: error.message };
    }

    console.error("addContactTagAction error:", error);
    return { success: false, error: "Failed to add tag" };
  }
}

export async function removeContactTagAction(contactId: string, tag: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await assertBillingAllowed(user.id, "contact:mutate");

    const db = await getRLSDb();
    const existing = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.userId, user.id)),
    });
    if (!existing) return { success: false, error: "Contact not found" };

    const normalized = (tag || "").trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: "Tag is required" };
    }

    await db
      .delete(contactTag)
      .where(
        and(
          eq(contactTag.userId, user.id),
          eq(contactTag.contactId, contactId),
          eq(contactTag.tag, normalized),
        ),
      );

    revalidateTag(`user-tags-${user.id}`, "max");
    return { success: true };
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return { success: false, error: error.message };
    }

    console.error("removeContactTagAction error:", error);
    return { success: false, error: "Failed to remove tag" };
  }
}

export async function getContactTagsAction(contactId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const db = await getRLSDb();
    const existing = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.userId, user.id)),
    });
    if (!existing) return { success: false, error: "Contact not found" };

    const rows = await db
      .select({ tag: contactTag.tag })
      .from(contactTag)
      .where(
        and(
          eq(contactTag.userId, user.id),
          eq(contactTag.contactId, contactId),
        ),
      )
      .orderBy(asc(contactTag.tag));

    return { success: true, tags: rows.map((r) => r.tag) };
  } catch (error) {
    console.error("getContactTagsAction error:", error);
    return { success: false, error: "Failed to fetch tags" };
  }
}

export async function fetchContactTagsForContacts(contactIds: string[]) {
  try {
    const user = await getUser();
    if (!user) return {} as Record<string, string[]>;

    if (!contactIds.length) return {} as Record<string, string[]>;

    const db = await getRLSDb();
    const rows = await db
      .select({ contactId: contactTag.contactId, tag: contactTag.tag })
      .from(contactTag)
      .where(
        and(
          eq(contactTag.userId, user.id),
          inArray(contactTag.contactId, contactIds),
        ),
      )
      .orderBy(asc(contactTag.contactId), asc(contactTag.tag));

    const map: Record<string, string[]> = {};
    for (const r of rows) {
      if (!map[r.contactId]) map[r.contactId] = [];
      map[r.contactId].push(r.tag);
    }
    return map;
  } catch (error) {
    console.error("fetchContactTagsForContacts error:", error);
    return {} as Record<string, string[]>;
  }
}

export async function getUserTagsAction() {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Not authenticated" };
    const db = await getRLSDb();

    const cachedFetch = nextCache(
      async (uid: string) => {
        const rows = await db
          .select({ tag: contactTag.tag })
          .from(contactTag)
          .where(eq(contactTag.userId, uid))
          .orderBy(asc(contactTag.tag));
        return Array.from(new Set(rows.map((r) => r.tag)));
      },
      ["user-tags", user.id],
      { tags: [`user-tags-${user.id}`], revalidate: 300 },
    );

    const distinct = await cachedFetch(user.id);
    return { success: true, tags: distinct };
  } catch (error) {
    console.error("getUserTagsAction error:", error);
    return { success: false, error: "Failed to fetch user tags" };
  }
}

export async function syncInstagramContacts(fullSync?: boolean) {
  const user = await getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const db = await getRLSDb();
    const integration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, user.id),
    });

    if (!integration) {
      return { success: false, error: "Instagram is not connected" };
    }

    const resolvedFullSync =
      typeof fullSync === "boolean"
        ? fullSync
        : process.env.NODE_ENV !== "production";

    try {
      console.log("Queueing contact sync for user:", user.id);
      await inngest.send({
        name: "contacts/sync",
        data: {
          userId: user.id,
          fullSync: resolvedFullSync,
        },
      });

      revalidatePath("/contacts");

      return { success: true, queued: true as const };
    } catch (queueError) {
      console.error("Failed to enqueue contact sync, falling back to direct sync:", queueError);

      const billing = await getBillingStatus(user.id);
      const contacts = await fetchAndStoreInstagramContactsCore({
        dbClient: db,
        userId: user.id,
        fullSync: resolvedFullSync,
        billing,
      });

      revalidatePath("/contacts");

      return { success: true, count: contacts.length, queued: false as const };
    }
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return { success: false, error: error.message };
    }

    console.error("Error triggering contact sync:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync contacts",
    };
  }
}

export async function getContactsLastUpdatedAt(): Promise<string | null> {
  try {
    const user = await getUser();
    if (!user) return null;

    const db = await getRLSDb();
    const rows = await db
      .select({ updatedAt: contact.updatedAt })
      .from(contact)
      .where(eq(contact.userId, user.id))
      .orderBy(desc(contact.updatedAt))
      .limit(1);

    const latest = rows[0]?.updatedAt;
    return latest ? latest.toISOString() : null;
  } catch (error) {
    console.error("Failed to get contacts lastUpdatedAt:", error);
    return null;
  }
}

export async function hasContactsUpdatedSince(
  sinceIso: string,
): Promise<{ updated: boolean }> {
  try {
    const user = await getUser();
    if (!user) return { updated: false };

    const since = new Date(sinceIso);
    if (Number.isNaN(since.getTime())) {
      return { updated: false };
    }

    const db = await getRLSDb();
    const rows = await db
      .select({ id: contact.id })
      .from(contact)
      .where(and(eq(contact.userId, user.id), gt(contact.updatedAt, since)))
      .limit(1);

    return { updated: rows.length > 0 };
  } catch (error) {
    console.error("Failed checking contacts updated since:", error);
    return { updated: false };
  }
}

export async function fetchConversationMessages(
  accessToken: string,
  conversationId: string,
): Promise<InstagramMessage[]> {
  try {
    console.log(`Fetching messages for conversation: ${conversationId}`);
    const messages = await fetchInstagramConversationMessagesForSync({
      accessToken,
      conversationId,
      limit: DEFAULT_MESSAGE_LIMIT,
    });
    console.log(
      `Retrieved ${messages.length} messages for conversation ${conversationId}`,
    );
    return messages;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Error fetching messages for conversation ${conversationId}:`,
      errorMessage,
    );

    if (error instanceof Error && error.message.includes("token expired")) {
      throw error;
    }

    return [];
  }
}


export async function generateFollowUpMessage(contactId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await assertBillingAllowed(user.id, "contact:mutate");

    const db = await getRLSDb();
    const contactData = await db.query.contact.findFirst({
      where: and(eq(contact.id, contactId), eq(contact.userId, user.id)),
    });

    if (!contactData) {
      return { success: false, error: "Contact not found" };
    }

    const integration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, user.id),
    });

    if (!integration?.accessToken) {
      return { success: false, error: "No Instagram integration found" };
    }

    // fetch last 10 messages for context
    const messages = await fetchConversationMessages(
      integration.accessToken,
      contactId,
    );

    const recentTranscript = messages
      .slice(0, 10)
      .map((msg) => {
        const sender =
          msg.from.username === integration.username ? "Business" : "Customer";
        const sanitizedMessage = sanitizeText(msg.message).slice(0, 500);
        return `${sender}: ${sanitizedMessage}`;
      })
      .join("\n");

    const businessKnowledgeSnapshot = await getBusinessKnowledgeSnapshotByUserId(
      db,
      user.id,
    );
    const fallbackBusinessKnowledge = buildKnowledgeFallbackText(
      businessKnowledgeSnapshot,
    );
    const [knowledgeProfile, contactProfile, knowledgeResults, contactResults] =
      await Promise.all([
        getMemoryProfile({
          containerTag: getKnowledgeContainerTag(user.id),
          q: contactData.lastMessage || contactData.username || "follow up",
        }).catch(() => null),
        getMemoryProfile({
          containerTag: getContactContainerTag(user.id, contactId),
          q: contactData.lastMessage || contactData.username || "follow up",
        }).catch(() => null),
        searchMemory({
          containerTag: getKnowledgeContainerTag(user.id),
          q: contactData.lastMessage || contactData.username || "follow up",
        }).catch(() => []),
        searchMemory({
          containerTag: getContactContainerTag(user.id, contactId),
          q: contactData.lastMessage || contactData.username || "follow up",
        }).catch(() => []),
      ]);

    const businessKnowledge =
      formatMemoryContext({
        title: "Business memory",
        profile: knowledgeProfile,
        results: knowledgeResults,
      }) || fallbackBusinessKnowledge;
    const contactMemory = formatMemoryContext({
      title: "Customer memory",
      profile: contactProfile,
      results: contactResults,
    });

    const personalized = await getPersonalizedFollowUpPrompt(
      db,
      {
        userId: user.id,
        customerName: contactData.username || "Unknown",
        stage: contactData.stage || "new",
        leadScore: contactData.leadScore || 0,
        lastMessage: contactData.lastMessage || "No previous message",
        recentTranscript,
        businessKnowledge:
          businessKnowledge || "No durable business memory found for this question.",
        contactMemory: contactMemory || "No prior customer memory found.",
      },
    );

    const aiResult = await generateText({
      model: geminiModel,
      system: `${DEFAULT_SIDEKICK_PROMPT}\nTone guidance: ${buildToneGuidance(
        businessKnowledgeSnapshot.toneProfile,
      )}\n${personalized.system}`,
      prompt: personalized.main,
      temperature: 0.4,
    });

    const followUpText = sanitizeText(aiResult.text).slice(0, 280);

    if (!followUpText) {
      return { success: false, error: "Failed to generate follow-up message" };
    }

    await db
      .update(contact)
      .set({
        followupMessage: followUpText,
        updatedAt: new Date(),
      })
      .where(and(eq(contact.id, contactId), eq(contact.userId, user.id)));

    revalidatePath("/contacts");
    return { success: true, message: followUpText };
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return { success: false, error: error.message };
    }

    console.error("Error generating follow-up message:", error);
    return { success: false, error: "Failed to generate follow-up message" };
  }
}

