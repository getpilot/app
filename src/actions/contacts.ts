"use server";

import axios from "axios";
import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { contact, instagramIntegration } from "@/lib/db/schema";
import { eq, and, inArray, desc, gt } from "drizzle-orm";
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

    const integration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, user.id),
    });

    if (!integration?.accessToken) {
      console.log("No Instagram integration found for user");
      return [];
    }

    console.log("Found Instagram integration, fetching contacts from DB");
    const contacts = await db.query.contact.findMany({
      where: eq(contact.userId, user.id),
    });
    console.log(`Found ${contacts.length} contacts in the database`);

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
    }));
  } catch (error) {
    console.error("Error fetching Instagram contacts:", error);
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

    const updateData = {
      updatedAt: new Date(),
    } as Record<string, unknown>;

    updateData[field] = value;

    await db.update(contact).set(updateData).where(eq(contact.id, contactId));

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

export async function syncInstagramContacts(fullSync?: boolean) {
  const user = await getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    console.log("Triggering contact sync for user:", user.id);
    await inngest.send({
      name: "contacts/sync",
      data: {
        userId: user.id,
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
  sinceIso: string
): Promise<{ updated: boolean }> {
  try {
    const user = await getUser();
    if (!user) return { updated: false };
    const since = new Date(sinceIso);
    if (Number.isNaN(since.getTime())) return { updated: false };

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

export async function analyzeConversation(
  messages: InstagramMessage[],
  username: string
): Promise<AnalysisResult> {
  try {
    console.log(`Analyzing conversation with ${username} using Gemini AI`);

    const formattedMessages = messages
      .map((msg) => {
        const sender = msg.from.username === username ? "Customer" : "Business";
        const sanitizedMessage = msg.message
          .replace(/[`'"]/g, "")
          .slice(0, 500);
        return `${sender}: ${sanitizedMessage}`;
      })
      .join("\n");

    const prompt = `
    You are a lead qualification expert for businesses using Instagram messaging.
    
    Analyze this Instagram conversation between a business and a potential customer:
    
    ${formattedMessages}
    
    Based on this conversation, provide the following information in JSON format:
    1. stage: The stage of the lead ("new", "lead", "follow-up", or "ghosted")
    2. sentiment: The customer sentiment ("hot", "warm", "cold", "neutral", or "ghosted")
    3. leadScore: A numerical score from 0-100 indicating lead quality
    4. nextAction: A brief recommendation for the next action to take with this lead
    5. leadValue: A numerical estimate (0-1000) of the potential value of this lead
    
    Return ONLY valid JSON with these fields and nothing else.
    `;

    console.log("Sending prompt to Gemini AI");
    const result = await generateText({
      model: geminiModel,
      system:
        "You are a lead qualification expert analyzing Instagram conversations. Always respond with valid JSON containing the requested fields: stage, sentiment, leadScore, nextAction, and leadValue. Never include explanations or additional text outside of the JSON object.",
      prompt,
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
  const integration = await db.query.instagramIntegration.findFirst({
    where: eq(instagramIntegration.userId, userId),
  });

  if (!integration || !integration.accessToken) {
    console.log("No Instagram integration found for user");
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

  const conversations = response.data.data.filter((item: InstagramConversation) => {
    if (!item || typeof item !== 'object') {
      console.warn("Skipping invalid conversation item:", item);
      return false;
    }
    
    if (!item.participants || !item.participants.data || !Array.isArray(item.participants.data)) {
      console.warn("Skipping conversation with invalid participants data:", item.id);
      return false;
    }
    
    return true;
  }) as InstagramConversation[];
  
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
  existingContactsMap: Map<string, typeof contact.$inferSelect>,
  fullSync: boolean
) {
  console.log(`Storing ${contactsData.length} contacts in database`);

  const contacts: InstagramContact[] = [];
  const contactsToInsert = [];

  for (const {
    participant,
    lastMessage,
    timestamp,
    messageTexts,
    analysis,
  } of contactsData) {
    const existingContact = existingContactsMap.get(participant.id);

    const contactData = {
      id: participant.id,
      name: participant?.username || "Unknown",
      lastMessage: lastMessage?.message || "",
      timestamp,
      messages: messageTexts,
      ...analysis,
    };

    contacts.push(contactData);

    contactsToInsert.push({
      id: participant.id,
      userId,
      username: participant.username,
      lastMessage: lastMessage?.message || null,
      lastMessageAt: lastMessage?.created_time
        ? new Date(lastMessage.created_time)
        : null,
      stage: analysis.stage,
      sentiment: analysis.sentiment,
      leadScore: analysis.leadScore,
      nextAction: analysis.nextAction,
      leadValue: analysis.leadValue,
      triggerMatched: existingContact?.triggerMatched || false,
      notes: existingContact?.notes || null,
      updatedAt: new Date(),
      createdAt: existingContact?.createdAt || new Date(),
    });
  }

  let dbPromises: Promise<unknown>[];
  if (fullSync) {
    dbPromises = contactsToInsert.map((contactToInsert) =>
      db
        .insert(contact)
        .values(contactToInsert)
        .onConflictDoUpdate({
          target: contact.id,
          set: {
            username: contactToInsert.username,
            lastMessage: contactToInsert.lastMessage,
            lastMessageAt: contactToInsert.lastMessageAt,
            stage: contactToInsert.stage,
            sentiment: contactToInsert.sentiment,
            leadScore: contactToInsert.leadScore,
            nextAction: contactToInsert.nextAction,
            leadValue: contactToInsert.leadValue,
            updatedAt: new Date(),
          },
        })
    );
  } else {
    dbPromises = contactsToInsert.map((contactToInsert) =>
      db
        .insert(contact)
        .values(contactToInsert)
        .onConflictDoNothing()
    );
  }

  await Promise.all(dbPromises);

  console.log(`Updated ${contactsToInsert.length} contacts in database`);
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
    const existingContacts = await db.query.contact.findMany({
      where: and(
        eq(contact.userId, userId),
        inArray(contact.id, participantIds)
      ),
    });

    const existingContactsMap = new Map(
      existingContacts.map((c) => [c.id, c])
    );

    const fullSync = options?.fullSync ?? process.env.NODE_ENV !== "production";
    const targetConversations = fullSync
      ? conversations
      : conversations.filter((conversation) => {
          const p = conversation.participants.data.find(
            (pp: InstagramParticipant) => pp.username !== integration.username
          );
          return p?.id ? !existingContactsMap.has(p.id) : false;
        });

    if (!fullSync && targetConversations.length === 0) {
      console.log("No new contacts to sync in incremental mode; skipping AI and message fetch.");
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