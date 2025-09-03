"use server";

import { db } from "@/lib/db";
import { contact, sidekickSetting } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";
import { sanitizeText } from "@/lib/utils";
import { getPersonalizedAutoReplyPrompt } from "@/actions/sidekick/personalized-prompts";

type GenerateReplyParams = {
  userId: string;
  igUserId: string;
  senderId: string;
  text: string;
  accessToken?: string;
};

export type GenerateReplyResult = {
  text: string;
};

const geminiModel = google("gemini-2.5-flash");

function buildContextFromMessages(
  messages: Array<{ who: string; message: string }>
) {
  return messages.map((m) => `${m.who}: ${sanitize(m.message)}`).join("\n");
}

function sanitize(input: string): string {
  return sanitizeText(input || "").slice(0, 500);
}

export async function generateReply(
  params: GenerateReplyParams
): Promise<GenerateReplyResult | null> {
  const { userId, senderId, text, accessToken } = params;

  const settings = await db.query.sidekickSetting.findFirst({
    where: eq(sidekickSetting.userId, userId),
  });

  const systemPrompt = settings?.systemPrompt || DEFAULT_SIDEKICK_PROMPT;

  const recentContact = await db.query.contact.findFirst({
    where: and(eq(contact.userId, userId), eq(contact.id, senderId)),
    orderBy: desc(contact.updatedAt),
  });

  const contextMessages: Array<{ who: string; message: string }> = [];

  if (accessToken) {
    try {
      const { fetchConversations, fetchConversationMessages } = await import(
        "@/lib/instagram/api"
      );
      const convRes = await fetchConversations({ accessToken });
      if (convRes.status >= 200 && convRes.status < 300) {
        const conversations = Array.isArray(convRes.data?.data)
          ? convRes.data.data
          : [];
        const convo = conversations.find((c: any) =>
          Array.isArray(c?.participants?.data)
            ? c.participants.data.some((p: any) => p?.id === senderId)
            : false
        );
        if (convo?.id) {
          const msgRes = await fetchConversationMessages({
            accessToken,
            conversationId: convo.id,
            limit: 10,
          });
          if (msgRes.status >= 200 && msgRes.status < 300) {
            const msgs = Array.isArray(msgRes.data?.data)
              ? msgRes.data.data
              : [];
            for (const m of msgs.reverse()) {
              const who = m?.from?.id === senderId ? "Customer" : "Business";
              if (m?.message) {
                contextMessages.push({ who, message: m.message });
              }
            }
          }
        }
      }
    } catch {
      // non-fatal; fall back to stored context
    }
  }

  // fallback: use stored lastMessage and the current message
  if (contextMessages.length === 0) {
    if (recentContact?.lastMessage) {
      contextMessages.push({ who: "Customer", message: recentContact.lastMessage });
    }
    contextMessages.push({ who: "Customer", message: text });
  }

  const context = buildContextFromMessages(contextMessages).slice(0, 2000);

  const personalized = await getPersonalizedAutoReplyPrompt(context, {
    userId,
  });

  const aiResult = await generateText({
    model: geminiModel,
    system: systemPrompt || personalized.system,
    prompt: personalized.main,
    temperature: 0.4,
  });

  const replyText = sanitize(aiResult.text);
  if (!replyText) return null;

  return { text: replyText };
}