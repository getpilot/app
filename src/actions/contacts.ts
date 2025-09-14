"use server";

import axios from "axios";
import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { inngest } from "@/lib/inngest/client";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import {
  InstagramContact,
  InstagramParticipant,
  InstagramMessage,
  InstagramConversation,
  AnalysisResult,
  ContactField,
} from "@/types/instagram";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";
import { sanitizeText } from "@/lib/utils";
import {
  getPersonalizedLeadAnalysisPrompt,
  getPersonalizedFollowUpPrompt,
} from "./sidekick/personalized-prompts";
import { Id } from "../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;
const toContactId = (id: string): Id<"contact"> => id as Id<"contact">;

const MIN_MESSAGES_PER_CONTACT = 2;
const DEFAULT_MESSAGE_LIMIT = 10;
const IG_API_VERSION = "v23.0";

const geminiModel = google("gemini-2.5-flash");

export async function fetchInstagramContacts(): Promise<InstagramContact[]> {
  try {
    console.log("Starting to fetch Instagram contacts");
    const user = await getUser();
    if (!user) {
      console.log("No authenticated user found");
      return [];
    }

    const integration = await convex.query(
      api.instagram.getInstagramIntegrationByUserId,
      {
        userId: toUserId(user._id),
      }
    );

    if (!integration?.accessToken) {
      console.log("No Instagram integration found for user");
      return [];
    }

    console.log("Found Instagram integration, fetching contacts from DB");
    const contacts = await convex.query(api.contacts.getContactsByUserId, {
      userId: toUserId(user._id),
    });
    console.log(`Found ${contacts.length} contacts in the database`);

    return contacts.map((c) => ({
      id: c._id,
      name: c.username || "Unknown",
      lastMessage: c.lastMessage || undefined,
      timestamp: c.lastMessageAt
        ? new Date(c.lastMessageAt).toISOString()
        : undefined,
      stage: c.stage || undefined,
      sentiment: c.sentiment || undefined,
      notes: c.notes || undefined,
      leadScore: c.leadScore || undefined,
      nextAction: c.nextAction || undefined,
      leadValue: c.leadValue || undefined,
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
    const contacts = await convex.query(
      api.contacts.getContactsByUserIdAndFollowupNeeded,
      {
        userId: toUserId(user._id),
      }
    );
    console.log(`Found ${contacts.length} contacts needing follow-up`);

    return contacts.map((c) => ({
      id: c._id,
      name: c.username || "Unknown",
      lastMessage: c.lastMessage || undefined,
      timestamp: c.lastMessageAt
        ? new Date(c.lastMessageAt).toISOString()
        : undefined,
      stage: c.stage || undefined,
      sentiment: c.sentiment || undefined,
      notes: c.notes || undefined,
      leadScore: c.leadScore || undefined,
      nextAction: c.nextAction || undefined,
      leadValue: c.leadValue || undefined,
      followupMessage: c.followupMessage || undefined,
    }));
  } catch (error) {
    console.error("Error fetching follow-up contacts:", error);
    return [];
  }
}

async function updateContactField(
  contactId: string,
  field: ContactField,
  value: string
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const existingContact = await convex.query(api.contacts.getContact, {
      id: toContactId(contactId),
    });

    if (!existingContact || existingContact.userId !== user._id) {
      return { success: false, error: "Contact not found or unauthorized" };
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    updateData[field] = value;

    await convex.mutation(api.contacts.updateContact, {
      id: toContactId(contactId),
      ...updateData,
    });

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    console.error(`Error updating contact ${field}:`, error);
    return { success: false, error: `Failed to update contact ${field}` };
  }
}

export async function updateContactStage(
  contactId: string,
  stage: "new" | "lead" | "follow-up" | "ghosted"
) {
  return updateContactField(contactId, "stage", stage);
}

export async function updateContactSentiment(
  contactId: string,
  sentiment: "hot" | "warm" | "cold" | "ghosted" | "neutral"
) {
  return updateContactField(contactId, "sentiment", sentiment);
}

export async function updateContactNotes(contactId: string, notes: string) {
  return updateContactField(contactId, "notes", notes);
}

export async function updateContactFollowUpStatus(
  contactId: string,
  followupNeeded: boolean
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const existingContact = await convex.query(api.contacts.getContact, {
      id: toContactId(contactId),
    });

    if (!existingContact || existingContact.userId !== user._id) {
      return { success: false, error: "Contact not found or unauthorized" };
    }

    await convex.mutation(api.contacts.updateContactFollowupStatus, {
      id: toContactId(contactId),
      followupNeeded,
      updatedAt: Date.now(),
    });

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
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
  }
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const existingContact = await convex.query(api.contacts.getContact, {
      id: toContactId(contactId),
    });

    if (!existingContact || existingContact.userId !== user._id) {
      return { success: false, error: "Contact not found or unauthorized" };
    }

    await convex.mutation(api.contacts.updateContactAfterFollowUp, {
      id: toContactId(contactId),
      ...updates,
      followupNeeded: false,
      updatedAt: Date.now(),
    });

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    console.error("Error updating contact after follow-up:", error);
    return {
      success: false,
      error: "Failed to update contact after follow-up",
    };
  }
}

export async function syncInstagramContacts(fullSync?: boolean) {
  const user = await getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    console.log("Triggering contact sync for user:", user._id);
    await inngest.send({
      name: "contacts/sync",
      data: {
        userId: user._id,
        fullSync:
          typeof fullSync === "boolean"
            ? fullSync
            : process.env.NODE_ENV !== "production",
      },
    });

    revalidatePath("/contacts");

    return { success: true };
  } catch (error) {
    console.error("Error triggering contact sync:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync contacts",
    };
  }
}

export async function fetchConversationMessages(
  accessToken: string,
  conversationId: string
): Promise<InstagramMessage[]> {
  try {
    console.log(`Fetching messages for conversation: ${conversationId}`);
    const response = await axios.get(
      `https://graph.instagram.com/${IG_API_VERSION}/${conversationId}/messages?fields=from{id,username},message,created_time&limit=${DEFAULT_MESSAGE_LIMIT}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const messages = response.data.data || [];
    console.log(
      `Retrieved ${messages.length} messages for conversation ${conversationId}`
    );
    return messages;
  } catch (error) {
    console.error(
      `Error fetching messages for conversation ${conversationId}:`,
      error
    );
    return [];
  }
}

export async function getContactsLastUpdatedAt(): Promise<string | null> {
  try {
    const user = await getUser();
    if (!user) return null;

    const lastUpdatedAt = await convex.query(
      api.contacts.getContactsLastUpdatedAt,
      {
        userId: toUserId(user._id),
      }
    );

    return lastUpdatedAt ? new Date(lastUpdatedAt).toISOString() : null;
  } catch (error) {
    console.error("Failed to get contacts lastUpdatedAt:", error);
    return null;
  }
}

export async function hasContactsUpdatedSince(
  sinceIso: string
): Promise<{ updated: boolean }> {
  try {
    const user = await getUser();
    if (!user) return { updated: false };
    const since = new Date(sinceIso);
    if (Number.isNaN(since.getTime())) return { updated: false };

    const updated = await convex.query(api.contacts.hasContactsUpdatedSince, {
      userId: toUserId(user._id),
      sinceTimestamp: since.getTime(),
    });

    return { updated };
  } catch (error) {
    console.error("Failed checking contacts updated since:", error);
    return { updated: false };
  }
}

export async function analyzeConversation(
  messages: InstagramMessage[],
  username: string
): Promise<AnalysisResult> {
  try {
    console.log(`Analyzing conversation with ${username} using Gemini AI`);

    const formattedMessages = messages
      .map((msg) => {
        const sender = msg.from.username === username ? "Customer" : "Business";
        const sanitizedMessage = sanitizeText(msg.message).slice(0, 500);
        return `${sender}: ${sanitizedMessage}`;
      })
      .join("\n");

    const personalized = await getPersonalizedLeadAnalysisPrompt(
      formattedMessages
    );

    console.log("Sending prompt to Gemini AI");
    const result = await generateText({
      model: geminiModel,
      system: personalized.system,
      prompt: personalized.main,
      temperature: 0,
    });

    console.log("Received response from Gemini AI");

    try {
      const analysis = JSON.parse(result.text);
      console.log("Parsed analysis:", analysis);

      return {
        stage: analysis.stage || "new",
        sentiment: analysis.sentiment || "neutral",
        leadScore: analysis.leadScore || 0,
        nextAction: analysis.nextAction || "",
        leadValue: analysis.leadValue || 0,
      };
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      console.log("Raw response:", result.text);

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedAnalysis = JSON.parse(jsonMatch[0]);
          return {
            stage: extractedAnalysis.stage || "new",
            sentiment: extractedAnalysis.sentiment || "neutral",
            leadScore: extractedAnalysis.leadScore || 0,
            nextAction: extractedAnalysis.nextAction || "",
            leadValue: extractedAnalysis.leadValue || 0,
          };
        } catch (e) {
          console.error("Failed to extract JSON with regex:", e);
        }
      }

      return {
        stage: "new",
        sentiment: "neutral",
        leadScore: 0,
        nextAction: "",
        leadValue: 0,
      };
    }
  } catch (error) {
    console.error("Error analyzing conversation with Gemini:", error);
    return {
      stage: "new",
      sentiment: "neutral",
      leadScore: 0,
      nextAction: "",
      leadValue: 0,
    };
  }
}

export async function batchAnalyzeConversations(
  conversationsData: Array<{ messages: InstagramMessage[]; username: string }>
): Promise<AnalysisResult[]> {
  console.log(`Batch analyzing ${conversationsData.length} conversations`);

  const validConversations = conversationsData.filter(
    ({ messages }) => messages.length >= MIN_MESSAGES_PER_CONTACT
  );

  console.log(
    `Filtered down to ${validConversations.length} valid conversations with enough messages`
  );

  if (validConversations.length === 0) {
    return [];
  }

  try {
    const analysisPromises = validConversations.map(({ messages, username }) =>
      analyzeConversation(messages, username)
    );

    const results = await Promise.all(analysisPromises);
    return results;
  } catch (error) {
    console.error("Error in parallel conversation analysis:", error);

    const results: AnalysisResult[] = [];
    for (const { messages, username } of validConversations) {
      try {
        const result = await analyzeConversation(messages, username);
        results.push(result);
      } catch (individualError) {
        console.error(`Failed to analyze conversation:`, individualError);
        results.push({
          stage: "new",
          sentiment: "neutral",
          leadScore: 0,
          nextAction: "",
          leadValue: 0,
        });
      }
    }

    return results;
  }
}

async function fetchInstagramIntegration(userId: string) {
  const integration = await convex.query(
    api.instagram.getInstagramIntegrationByUserId,
    {
      userId: toUserId(userId),
    }
  );

  if (!integration || !integration.accessToken) {
    console.log("No Instagram integration found for user");
    return null;
  }

  const now = new Date();
  const exp = integration.expiresAt ? new Date(integration.expiresAt) : null;
  if (exp && exp.getTime() < now.getTime()) {
    console.error(
      `instagram token expired for user ${userId}; skipping sync until reconnected`
    );
    return null;
  }

  return integration;
}

async function fetchInstagramConversations(accessToken: string) {
  console.log("Fetching conversations from Instagram API");
  const response = await axios.get(
    `https://graph.instagram.com/${IG_API_VERSION}/me/conversations?fields=participants,messages{from,message,created_time},updated_time`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.data || !Array.isArray(response.data.data)) {
    console.error("Invalid Instagram API response format:", response.data);
    throw new Error("Instagram API returned invalid data format");
  }

  const conversations = response.data.data.filter(
    (item: InstagramConversation) => {
      if (!item || typeof item !== "object") {
        console.warn("Skipping invalid conversation item:", item);
        return false;
      }

      if (
        !item.participants ||
        !item.participants.data ||
        !Array.isArray(item.participants.data)
      ) {
        console.warn(
          "Skipping conversation with invalid participants data:",
          item.id
        );
        return false;
      }

      return true;
    }
  ) as InstagramConversation[];

  console.log(`Found ${conversations.length} valid conversations`);
  return conversations;
}

async function enrichConversationsWithMessages(
  conversations: InstagramConversation[],
  accessToken: string,
  username: string
) {
  const enrichedData: Array<{
    conversation: InstagramConversation;
    participant: InstagramParticipant;
    messages: InstagramMessage[];
    messageTexts: string[];
  }> = [];

  const enrichPromises = conversations.map(async (conversation) => {
    const participant = conversation.participants.data.find(
      (p: InstagramParticipant) => p.username !== username
    );

    if (!participant?.id) {
      return null;
    }

    console.log(
      `Processing contact: ${participant.username || "Unknown"} (${
        participant.id
      })`
    );

    const messages = await fetchConversationMessages(
      accessToken,
      conversation.id
    );
    const messageTexts = messages.map(
      (msg) => `${msg.from.username}: ${msg.message}`
    );

    if (messages.length >= MIN_MESSAGES_PER_CONTACT) {
      return {
        conversation,
        participant,
        messages,
        messageTexts,
      };
    } else {
      console.log(
        `Not enough messages (${
          messages.length
        }/${MIN_MESSAGES_PER_CONTACT}) found for ${
          participant.username || "Unknown"
        }`
      );
      return null;
    }
  });

  const results = await Promise.all(enrichPromises);

  for (const result of results) {
    if (result !== null) {
      enrichedData.push(result);
    }
  }

  return enrichedData;
}

async function storeContacts(
  contactsData: Array<{
    participant: InstagramParticipant;
    lastMessage?: InstagramMessage;
    timestamp: string;
    messageTexts: string[];
    analysis: AnalysisResult;
  }>,
  userId: string,
  existingContactsMap: Map<string, any>,
  fullSync: boolean
) {
  console.log(`Storing ${contactsData.length} contacts in database`);

  const contacts: InstagramContact[] = [];
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  for (const {
    participant,
    lastMessage,
    timestamp,
    messageTexts,
    analysis,
  } of contactsData) {
    const existingContact = existingContactsMap.get(participant.id);
    const lastMessageTime = lastMessage?.created_time
      ? new Date(lastMessage.created_time).getTime()
      : new Date(timestamp).getTime();

    // calculate if follow-up is needed
    const needsFollowup =
      lastMessageTime < twentyFourHoursAgo && analysis.stage !== "ghosted";

    const contactData = {
      id: participant.id,
      name: participant?.username || "Unknown",
      lastMessage: lastMessage?.message || "",
      timestamp,
      messages: messageTexts,
      ...analysis,
    };

    contacts.push(contactData);

    if (existingContact) {
      // Update existing contact
      if (fullSync) {
        await convex.mutation(api.contacts.updateContact, {
          id: toContactId(participant.id),
          username: participant.username || undefined,
          lastMessage: lastMessage?.message || undefined,
          lastMessageAt: lastMessageTime,
          stage: analysis.stage,
          sentiment: analysis.sentiment,
          leadScore: analysis.leadScore,
          nextAction: analysis.nextAction,
          leadValue: analysis.leadValue,
          followupNeeded: needsFollowup,
          updatedAt: now,
        });
      } else {
        await convex.mutation(api.contacts.updateContact, {
          id: toContactId(participant.id),
          lastMessage: lastMessage?.message || undefined,
          lastMessageAt: lastMessageTime,
          followupNeeded: needsFollowup,
          updatedAt: now,
        });
      }
    } else {
      // Create new contact
      await convex.mutation(api.contacts.createContact, {
        userId: toUserId(userId),
        username: participant.username || undefined,
        lastMessage: lastMessage?.message || undefined,
        lastMessageAt: lastMessageTime,
        stage: analysis.stage,
        sentiment: analysis.sentiment,
        leadScore: analysis.leadScore,
        nextAction: analysis.nextAction,
        leadValue: analysis.leadValue,
        triggerMatched: false,
        followupNeeded: needsFollowup,
        notes: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  console.log(`Updated ${contactsData.length} contacts in database`);
  return contacts;
}

export async function fetchAndStoreInstagramContacts(
  userId: string,
  options?: { fullSync?: boolean }
): Promise<InstagramContact[]> {
  try {
    console.log(
      `Starting to fetch and store Instagram contacts for user: ${userId}`
    );
    const startTime = Date.now();

    // Step 1: Fetch Instagram integration
    const integration = await fetchInstagramIntegration(userId);
    if (!integration) {
      return [];
    }

    // Step 2: Fetch conversations from Instagram API
    const conversations = await fetchInstagramConversations(
      integration.accessToken
    );

    // Step 3: Determine which conversations to process based on sync mode
    const allParticipants = conversations
      .map((conversation) =>
        conversation.participants.data.find(
          (p: InstagramParticipant) => p.username !== integration.username
        )
      )
      .filter(Boolean) as InstagramParticipant[];

    const participantIds = allParticipants.map((p) => p.id);

    // Step 4: Batch fetch existing contacts to avoid N+1 query problem
    const existingContacts = await convex.query(api.contacts.getContactsByIds, {
      userId: toUserId(userId),
      contactIds: participantIds.map((id) => toContactId(id)),
    });

    const existingContactsMap = new Map(
      existingContacts.map((c) => [c._id, c])
    );

    const fullSync = options?.fullSync ?? process.env.NODE_ENV !== "production";
    const targetConversations = fullSync
      ? conversations
      : conversations.filter((conversation) => {
          const p = conversation.participants.data.find(
            (pp: InstagramParticipant) => pp.username !== integration.username
          );
          if (!p?.id) return false;
          const notSeenBefore = !existingContactsMap.has(toContactId(p.id));
          const lastSynced = integration.lastSyncedAt
            ? new Date(integration.lastSyncedAt)
            : null;
          if (!lastSynced) return true;
          const updatedAt = new Date(conversation.updated_time);
          return notSeenBefore || updatedAt > lastSynced;
        });

    if (!fullSync && targetConversations.length === 0) {
      console.log(
        "No new contacts to sync in incremental mode; updating follow-up flags and skipping AI and message fetch."
      );

      try {
        const now = new Date();
        const twentyFourHoursAgo = new Date(
          now.getTime() - 24 * 60 * 60 * 1000
        );

        const existing = await convex.query(api.contacts.getContactsByUserId, {
          userId: toUserId(userId),
        });

        const idsToSetTrue: string[] = [];
        const idsToSetFalse: string[] = [];

        for (const c of existing) {
          const lastAt = c.lastMessageAt ? new Date(c.lastMessageAt) : null;
          const shouldFollow =
            !!lastAt && lastAt < twentyFourHoursAgo && c.stage !== "ghosted";
          if (shouldFollow && !c.followupNeeded) idsToSetTrue.push(c._id);
          if (!shouldFollow && c.followupNeeded) idsToSetFalse.push(c._id);
        }

        if (idsToSetTrue.length > 0) {
          await Promise.all(
            idsToSetTrue.map((id) =>
              convex.mutation(api.contacts.updateContactFollowupStatus, {
                id: toContactId(id),
                followupNeeded: true,
                updatedAt: Date.now(),
              })
            )
          );
        }

        if (idsToSetFalse.length > 0) {
          await Promise.all(
            idsToSetFalse.map((id) =>
              convex.mutation(api.contacts.updateContactFollowupStatus, {
                id: toContactId(id),
                followupNeeded: false,
                updatedAt: Date.now(),
              })
            )
          );
        }

        console.log(
          `Updated follow-up flags: set true for ${idsToSetTrue.length}, set false for ${idsToSetFalse.length}`
        );
      } catch (e) {
        console.error(
          "Failed to update follow-up flags in incremental no-op path",
          e
        );
      }

      return [];
    }

    // Step 5: Enrich conversations with messages (only for target conversations)
    const enrichedData = await enrichConversationsWithMessages(
      targetConversations,
      integration.accessToken,
      integration.username
    );

    // Step 6: Analyze conversations (only those we are processing)
    console.log(`Analyzing ${enrichedData.length} conversations with messages`);
    const analysisResults = await batchAnalyzeConversations(
      enrichedData.map(({ messages, participant }) => ({
        messages,
        username: participant.username,
      }))
    );

    // Step 7: Prepare and store contacts
    const contactsData = enrichedData.map((data, index) => {
      const lastMessage = data.conversation.messages?.data?.[0];
      return {
        participant: data.participant,
        lastMessage,
        timestamp: lastMessage?.created_time || data.conversation.updated_time,
        messageTexts: data.messageTexts,
        analysis: analysisResults[index],
      };
    });

    // Step 8: Store contacts in database (mode-aware)
    const contacts = await storeContacts(
      contactsData,
      userId,
      existingContactsMap,
      fullSync
    );

    // Step 9: update lastSyncedAt for the integration when incremental
    await convex.mutation(api.instagram.updateLastSyncedAt, {
      id: integration._id,
      lastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    });

    const endTime = Date.now();
    console.log(
      `Processed ${contacts.length} contacts in total in ${
        (endTime - startTime) / 1000
      } seconds`
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

export async function generateFollowUpMessage(contactId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const contactData = await convex.query(api.contacts.getContact, {
      id: toContactId(contactId),
    });

    if (!contactData || contactData.userId !== user._id) {
      return { success: false, error: "Contact not found" };
    }

    const integration = await convex.query(
      api.instagram.getInstagramIntegrationByUserId,
      {
        userId: toUserId(user._id),
      }
    );

    if (!integration?.accessToken) {
      return { success: false, error: "No Instagram integration found" };
    }

    const settings = await convex.query(api.sidekick.getSidekickSetting, {
      userId: toUserId(user._id),
    });

    const systemPrompt = settings?.systemPrompt || DEFAULT_SIDEKICK_PROMPT;

    // fetch last 10 messages for context
    const messages = await fetchConversationMessages(
      integration.accessToken,
      contactId
    );

    const conversationHistory = messages
      .slice(0, 10)
      .map((msg) => {
        const sender =
          msg.from.username === integration.username ? "Business" : "Customer";
        const sanitizedMessage = sanitizeText(msg.message).slice(0, 500);
        return `${sender}: ${sanitizedMessage}`;
      })
      .join("\n");

    const geminiModel = google("gemini-2.5-flash");

    const personalized = await getPersonalizedFollowUpPrompt(
      contactData.username || "Unknown",
      contactData.stage || "new",
      contactData.leadScore || 0,
      contactData.lastMessage || "No previous message",
      conversationHistory
    );

    const aiResult = await generateText({
      model: geminiModel,
      system: systemPrompt || personalized.system,
      prompt: personalized.main,
      temperature: 0.4,
    });

    const followUpText = sanitizeText(aiResult.text).slice(0, 280);

    if (!followUpText) {
      return { success: false, error: "Failed to generate follow-up message" };
    }

    await convex.mutation(api.contacts.updateContactFollowupMessage, {
      id: toContactId(contactId),
      followupMessage: followUpText,
      updatedAt: Date.now(),
    });

    revalidatePath("/contacts");
    return { success: true, message: followUpText };
  } catch (error) {
    console.error("Error generating follow-up message:", error);
    return { success: false, error: "Failed to generate follow-up message" };
  }
}