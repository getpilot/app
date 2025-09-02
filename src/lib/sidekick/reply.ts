"use server";

import { db } from "@/lib/db";
import { contact, sidekickSetting } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

type GenerateReplyParams = {
  userId: string;
  igUserId: string;
  senderId: string;
  text: string;
};

export type GenerateReplyResult = {
  text: string;
  confidence: number;
};

const geminiModel = google("gemini-2.5-flash");

function buildContextFromMessages(
  messages: Array<{ who: string; message: string }>
) {
  return messages.map((m) => `${m.who}: ${sanitize(m.message)}`).join("\n");
}

function sanitize(input: string): string {
  return (input || "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[`'"<>{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function heuristicConfidence(replyText: string, userMessage: string): number {
  const keywords = [
    "book",
    "call",
    "schedule",
    "pricing",
    "price",
    "subscribe",
    "buy",
    "trial",
    "demo",
    "interested",
  ];
  const text = `${replyText} ${userMessage}`.toLowerCase();
  const hits = keywords.reduce((acc, k) => acc + (text.includes(k) ? 1 : 0), 0);
  const score = Math.min(1, 0.5 + hits * 0.1);
  return Number(score.toFixed(2));
}

export async function generateReply(
  params: GenerateReplyParams
): Promise<GenerateReplyResult | null> {
  const { userId, senderId, text } = params;

  const settings = await db.query.sidekickSetting.findFirst({
    where: eq(sidekickSetting.userId, userId),
  });

  const systemPrompt =
    settings?.systemPrompt ||
    "You are a friendly, professional assistant focused on qualifying leads and helping with business inquiries.";

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

  const prompt = `You are Sidekick. Continue the conversation with the customer in 1-2 short sentences. Be helpful, friendly, and guide toward the next step. Keep it under 280 characters.\n\nConversation so far:\n${context}`;

  const aiResult = await generateText({
    model: geminiModel,
    system: systemPrompt,
    prompt,
    temperature: 0.4,
  });

  const replyText = sanitize(aiResult.text);
  if (!replyText) return null;

  const confidence = heuristicConfidence(replyText, text);
  return { text: replyText, confidence };
}