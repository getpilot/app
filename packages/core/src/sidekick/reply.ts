import { contact } from "@pilot/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { fetchConversationMessages, fetchConversations } from "@pilot/instagram";
import type { InstagramConversation, InstagramParticipant } from "@pilot/types/instagram";
import { generateText, geminiModel } from "../ai/model";
import {
  buildKnowledgeFallbackText,
  buildToneGuidance,
  formatMemoryContext,
  getContactContainerTag,
  getKnowledgeContainerTag,
  getMemoryProfile,
  searchMemory,
} from "../memory/supermemory";
import {
  getBusinessKnowledgeSnapshotByUserId,
  getPersonalizedAutoReplyPrompt,
} from "./personalization";
import { sanitizeText } from "../utils";

export type GenerateReplyParams = {
  dbClient: any;
  userId: string;
  senderId: string;
  text: string;
  accessToken?: string;
  igUserId?: string;
};

export type GenerateReplyResult = {
  text: string;
};

function buildContextFromMessages(messages: Array<{ who: string; message: string }>) {
  return messages
    .map((message) => `${message.who}: ${sanitizeText(message.message).slice(0, 500)}`)
    .join("\n");
}

export async function generateReply(
  params: GenerateReplyParams,
): Promise<GenerateReplyResult | null> {
  const { dbClient, userId, senderId, text, accessToken, igUserId } = params;

  const recentContact = await dbClient.query.contact.findFirst({
    where: and(eq(contact.userId, userId), eq(contact.id, senderId)),
    orderBy: desc(contact.updatedAt),
  });

  const contextMessages: Array<{ who: string; message: string }> = [];

  if (accessToken) {
    try {
      const conversationsResponse = await fetchConversations({
        accessToken,
        igUserId,
      });
      if (conversationsResponse.status >= 200 && conversationsResponse.status < 300) {
        const conversations = Array.isArray(conversationsResponse.data?.data)
          ? conversationsResponse.data.data
          : [];
        const conversation = conversations.find((item: InstagramConversation) =>
          Array.isArray(item?.participants?.data)
            ? item.participants.data.some((participant: InstagramParticipant) => participant?.id === senderId)
            : false,
        );

        if (conversation?.id) {
          const messagesResponse = await fetchConversationMessages({
            accessToken,
            conversationId: conversation.id,
            limit: 10,
          });

          if (messagesResponse.status >= 200 && messagesResponse.status < 300) {
            const messages = Array.isArray(messagesResponse.data?.data)
              ? messagesResponse.data.data
              : [];

            for (const message of messages.slice().reverse()) {
              const who = message?.from?.id === senderId ? "Customer" : "Business";
              if (message?.message) {
                contextMessages.push({ who, message: message.message });
              }
            }
          }
        }
      }
    } catch {
      // fall back to stored context
    }
  }

  if (contextMessages.length === 0) {
    if (recentContact?.lastMessage) {
      contextMessages.push({ who: "Customer", message: recentContact.lastMessage });
    }
    contextMessages.push({ who: "Customer", message: text });
  }

  const recentTranscript = buildContextFromMessages(contextMessages).slice(0, 2000);
  const businessKnowledgeSnapshot = await getBusinessKnowledgeSnapshotByUserId(
    dbClient,
    userId,
  );
  const fallbackBusinessKnowledge = buildKnowledgeFallbackText(
    businessKnowledgeSnapshot,
  );
  const [knowledgeProfile, contactProfile, knowledgeResults, contactResults] =
    await Promise.all([
      getMemoryProfile({
        containerTag: getKnowledgeContainerTag(userId),
        q: text,
      }).catch(() => null),
      getMemoryProfile({
        containerTag: getContactContainerTag(userId, senderId),
        q: text,
      }).catch(() => null),
      searchMemory({
        containerTag: getKnowledgeContainerTag(userId),
        q: text,
      }).catch(() => []),
      searchMemory({
        containerTag: getContactContainerTag(userId, senderId),
        q: text,
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
  const toneGuidance = buildToneGuidance(businessKnowledgeSnapshot.toneProfile);
  const personalized = await getPersonalizedAutoReplyPrompt(dbClient, {
    userId,
    recentTranscript,
    businessKnowledge:
      businessKnowledge || "No durable business memory found for this question.",
    contactMemory: contactMemory || "No prior customer memory found.",
  });

  const aiResult = await generateText({
    model: geminiModel,
    system: `${personalized.system}\nTone guidance: ${toneGuidance}`,
    prompt: personalized.main,
    temperature: 0.4,
  });

  const replyText = sanitizeText(aiResult.text || "").slice(0, 500);
  if (!replyText) {
    return null;
  }

  return { text: replyText };
}
