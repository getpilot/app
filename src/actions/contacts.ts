"use server";

import axios from "axios";
import { getInstagramIntegration } from "./instagram";
import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { instagramIntegration } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type InstagramContact = {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
};

export async function fetchInstagramContacts(): Promise<InstagramContact[]> {
  const user = await getUser();

  if (!user) {
    return [];
  }

  const instagram = await getInstagramIntegration();

  if (!instagram.connected || !instagram.id) {
    return [];
  }

  const integration = await db.query.instagramIntegration.findFirst({
    where: eq(instagramIntegration.userId, user.id),
  });

  if (!integration || !integration.accessToken) {
    return [];
  }

  try {
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

    const contacts: InstagramContact[] = await Promise.all(
      conversations.map(
        async (conversation: {
          participants: {
            data: {
              id: string;
              username: string;
            }[];
          };
          messages: {
            data: {
              from: string;
              message: string;
              created_time: string;
            }[];
          };
          updated_time: string;
        }) => {
          const participant = conversation.participants.data.find(
            (p) => p.username !== integration.username
          );

          const lastMessage = conversation.messages?.data?.[0];

          return {
            id: participant?.id || "unknown",
            name: participant?.username || "Unknown",
            lastMessage: lastMessage?.message || "",
            timestamp: lastMessage?.created_time || conversation.updated_time,
          };
        }
      )
    );

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