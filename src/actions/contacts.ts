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
};

type InstagramParticipant = {
  id: string;
  username: string;
};

type InstagramMessage = {
  from: string;
  message: string;
  created_time: string;
};

type InstagramConversation = {
  participants: {
    data: InstagramParticipant[];
  };
  messages?: {
    data: InstagramMessage[];
  };
  updated_time: string;
};

export async function fetchInstagramContacts(): Promise<InstagramContact[]> {
  const user = await getUser();

  if (!user) {
    return [];
  }

  try {
    const contacts = await db.query.contact.findMany({
      where: eq(contact.userId, user.id),
      orderBy: (contact, { desc }) => [desc(contact.lastMessageAt)]
    });

    return contacts.map(c => ({
      id: c.id,
      name: c.username || "Unknown",
      lastMessage: c.notes || "",
      timestamp: c.lastMessageAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch contacts from database:", error);
    return [];
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
    const conversations: InstagramConversation[] = data.data || [];

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

      await db
        .insert(contact)
        .values({
          id: participant.id,
          userId: userId,
          username: participant.username,
          lastMessageAt: lastMessage?.created_time ? new Date(lastMessage.created_time) : null,
          notes: lastMessage?.message || null,
        })
        .onConflictDoUpdate({
          target: contact.id,
          set: {
            username: participant.username,
            lastMessageAt: lastMessage?.created_time ? new Date(lastMessage.created_time) : undefined,
            notes: lastMessage?.message || undefined,
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