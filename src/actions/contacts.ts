"use server";

import axios from "axios";
import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { contact, instagramIntegration } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { revalidatePath } from "next/cache";

export type InstagramContact = {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  stage?: string;
  sentiment?: string;
  notes?: string;
};

type InstagramParticipant = {
  id: string;
  username: string;
};

export async function fetchInstagramContacts(): Promise<InstagramContact[]> {
  try {
    const user = await getUser();
    if (!user) {
      return [];
    }

    const integration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, user.id),
    });

    if (!integration?.accessToken) {
      return [];
    }

    const contacts = await db.query.contact.findMany({
      where: eq(contact.userId, user.id),
    });

    return contacts.map((c) => ({
      id: c.id,
      name: c.username || "Unknown",
      timestamp: c.lastMessageAt?.toISOString(),
      stage: c.stage || undefined,
      sentiment: c.sentiment || undefined,
      notes: c.notes || undefined,
    }));
  } catch (error) {
    console.error("Error fetching Instagram contacts:", error);
    return [];
  }
}

export async function updateContactStage(contactId: string, stage: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await db
      .update(contact)
      .set({
        stage,
        updatedAt: new Date(),
      })
      .where(eq(contact.id, contactId));

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    console.error("Error updating contact stage:", error);
    return { success: false, error: "Failed to update contact stage" };
  }
}

export async function updateContactSentiment(contactId: string, sentiment: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await db
      .update(contact)
      .set({
        sentiment,
        updatedAt: new Date(),
      })
      .where(eq(contact.id, contactId));

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    console.error("Error updating contact sentiment:", error);
    return { success: false, error: "Failed to update contact sentiment" };
  }
}

export async function updateContactNotes(contactId: string, notes: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await db
      .update(contact)
      .set({
        notes,
        updatedAt: new Date(),
      })
      .where(eq(contact.id, contactId));

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    console.error("Error updating contact notes:", error);
    return { success: false, error: "Failed to update contact notes" };
  }
}

export async function syncInstagramContacts() {
  const user = await getUser();
  
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await inngest.send({
      name: "contacts/sync",
      data: { userId: user.id },
    });

    revalidatePath("/contacts");
    
    return { success: true };
  } catch (error) {
    console.error("Error triggering contact sync:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to sync contacts" 
    };
  }
}

export async function fetchAndStoreInstagramContacts(userId: string): Promise<InstagramContact[]> {
  try {
    const integration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, userId),
    });

    if (!integration || !integration.accessToken) {
      return [];
    }

    const response = await axios.get(
      `https://graph.instagram.com/v23.0/me/conversations?fields=participants,messages{from,message,created_time},updated_time`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    );

    const data = response.data;
    const conversations = data.data || [];

    const contacts: InstagramContact[] = [];

    for (const conversation of conversations) {
      const participant = conversation.participants.data.find(
        (p: InstagramParticipant) => p.username !== integration.username
      );

      const lastMessage = conversation.messages?.data?.[0];
      
      if (!participant?.id) continue;
      
      const contactData = {
        id: participant.id,
        name: participant?.username || "Unknown",
        lastMessage: lastMessage?.message || "",
        timestamp: lastMessage?.created_time || conversation.updated_time,
      };
      
      contacts.push(contactData);

      const existingContact = await db.query.contact.findFirst({
        where: eq(contact.id, participant.id)
      });

      await db
        .insert(contact)
        .values({
          id: participant.id,
          userId: userId,
          username: participant.username,
          lastMessageAt: lastMessage?.created_time ? new Date(lastMessage.created_time) : null,
          notes: existingContact?.notes || null,
          stage: existingContact?.stage || 'new',
          sentiment: existingContact?.sentiment || 'neutral',
          leadScore: existingContact?.leadScore || 0,
          nextAction: existingContact?.nextAction || null,
        })
        .onConflictDoUpdate({
          target: contact.id,
          set: {
            username: participant.username,
            lastMessageAt: lastMessage?.created_time ? new Date(lastMessage.created_time) : undefined,
            updatedAt: new Date(),
          },
        });
    }

    return contacts;
  } catch (error) {
    console.error("Failed to fetch Instagram contacts:", {
      message: error instanceof Error ? error.message : "Unknown error",
      status:
        error instanceof Error && "response" in error
          ? (error as { response?: { status: number } }).response?.status
          : undefined,
    });
    return [];
  }
}