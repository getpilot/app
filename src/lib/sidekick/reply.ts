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
  const { userId, senderId, text } = params;

  const settings = await db.query.sidekickSetting.findFirst({
    where: eq(sidekickSetting.userId, userId),
  });

  const systemPrompt = settings?.systemPrompt || DEFAULT_SIDEKICK_PROMPT;

  const recentContact = await db.query.contact.findFirst({
    where: and(eq(contact.userId, userId), eq(contact.id, senderId)),
    orderBy: desc(contact.updatedAt),
  });

  const contextMessages: Array<{ who: string; message: string }> = [];
  if (recentContact?.lastMessage) {
    contextMessages.push({
      who: "Customer",
      message: recentContact.lastMessage,
    });
  }
  contextMessages.push({ who: "Customer", message: text });

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