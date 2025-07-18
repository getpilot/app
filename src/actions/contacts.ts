"use server";

import axios from "axios";
import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { contact, instagramIntegration } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const BATCH_SIZE = 20;
const MIN_CONTACTS_FOR_BATCH_ANALYSIS = 5;
const MIN_MESSAGES_PER_CONTACT = 2;

export type InstagramContact = {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  stage?: string;
  sentiment?: string;
  notes?: string;
  leadScore?: number;
  nextAction?: string;
  leadValue?: number;
  messages?: string[];
};

type InstagramParticipant = {
  id: string;
  username: string;
};

type InstagramMessage = {
  from: { id: string; username: string };
  message: string;
  created_time: string;
};

interface InstagramConversation {
  id: string;
  participants: {
    data: InstagramParticipant[];
  };
  messages?: {
    data: InstagramMessage[];
  };
  updated_time: string;
}

type GeminiAnalysisResult = {
  stage: string;
  sentiment: string;
  leadScore: number;
  nextAction: string;
  leadValue: number;
};

const geminiModel = google('gemini-2.5-flash');

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
    console.log("Triggering contact sync for user:", user.id);
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

export async function fetchConversationMessages(accessToken: string, conversationId: string): Promise<InstagramMessage[]> {
  try {
    console.log(`Fetching messages for conversation: ${conversationId}`);
    const response = await axios.get(
      `https://graph.instagram.com/v23.0/${conversationId}/messages?fields=from{id,username},message,created_time&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const messages = response.data.data || [];
    console.log(`Retrieved ${messages.length} messages for conversation ${conversationId}`);
    return messages;
  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    return [];
  }
}

export async function analyzeConversation(messages: InstagramMessage[], username: string): Promise<GeminiAnalysisResult> {
  try {
    console.log(`Analyzing conversation with ${username} using Gemini AI`);
    
    const formattedMessages = messages.map(msg => {
      const sender = msg.from.username === username ? "Customer" : "Business";
      return `${sender}: ${msg.message}`;
    }).join("\n");

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
      system: "You are a lead qualification expert analyzing Instagram conversations. Always respond with valid JSON containing the requested fields: stage, sentiment, leadScore, nextAction, and leadValue. Never include explanations or additional text outside of the JSON object.",
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
): Promise<GeminiAnalysisResult[]> {
  console.log(`Batch analyzing ${conversationsData.length} conversations`);
  
  const results: GeminiAnalysisResult[] = [];
  
  // Filter out conversations with too few messages
  const validConversations = conversationsData.filter(
    ({ messages }) => messages.length >= MIN_MESSAGES_PER_CONTACT
  );
  
  console.log(`Filtered down to ${validConversations.length} valid conversations with enough messages`);
  
  if (validConversations.length === 0) {
    return [];
  }
  
  // Skip batching if there are too few conversations
  if (validConversations.length < MIN_CONTACTS_FOR_BATCH_ANALYSIS) {
    console.log(`Only ${validConversations.length} conversations - below threshold of ${MIN_CONTACTS_FOR_BATCH_ANALYSIS}. Processing without batching.`);
    const individualPromises = validConversations.map(({ messages, username }) => 
      analyzeConversation(messages, username)
    );
    
    const individualResults = await Promise.all(individualPromises);
    return individualResults;
  }
  
  // Process in batches
  for (let i = 0; i < validConversations.length; i += BATCH_SIZE) {
    const batch = validConversations.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(validConversations.length / BATCH_SIZE)} with ${batch.length} conversations`);
    
    const batchPromises = batch.map(({ messages, username }) => 
      analyzeConversation(messages, username)
    );
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      console.log(`Successfully processed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
    } catch (error) {
      console.error(`Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
      
      console.log("Falling back to individual processing for this batch");
      for (const { messages, username } of batch) {
        try {
          const result = await analyzeConversation(messages, username);
          results.push(result);
        } catch (individualError) {
          console.error(`Failed to analyze individual conversation:`, individualError);
          results.push({
            stage: "new",
            sentiment: "neutral",
            leadScore: 0,
            nextAction: "",
            leadValue: 0,
          });
        }
      }
    }
    
    // Add a short delay between batches
    if (i + BATCH_SIZE < validConversations.length) {
      console.log("Brief pause before next batch...");
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`Completed analysis of ${results.length} conversations`);
  return results;
}

export async function fetchAndStoreInstagramContacts(userId: string): Promise<InstagramContact[]> {
  try {
    console.log(`Starting to fetch and store Instagram contacts for user: ${userId}`);
    const integration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, userId),
    });

    if (!integration || !integration.accessToken) {
      console.log("No Instagram integration found for user");
      return [];
    }

    console.log("Fetching conversations from Instagram API");
    const response = await axios.get(
      `https://graph.instagram.com/v23.0/me/conversations?fields=participants,messages{from,message,created_time},updated_time`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    );

    const data = response.data;
    const conversations = data.data as InstagramConversation[];
    console.log(`Found ${conversations.length} conversations`);
    
    const conversationsToAnalyze: Array<{
      conversation: InstagramConversation;
      participant: InstagramParticipant;
      messages: InstagramMessage[];
      messageTexts: string[];
    }> = [];

    for (const conversation of conversations) {
      const participant = conversation.participants.data.find(
        (p: InstagramParticipant) => p.username !== integration.username
      );

      if (!participant?.id) {
        console.log("Skipping conversation with no participant ID");
        continue;
      }
      
      console.log(`Processing contact: ${participant.username || 'Unknown'} (${participant.id})`);
      
      const messages = await fetchConversationMessages(integration.accessToken, conversation.id);
      
      // Format messages for storage/display
      const messageTexts = messages.map(msg => `${msg.from.username}: ${msg.message}`);
      
      if (messages.length >= MIN_MESSAGES_PER_CONTACT) {
        conversationsToAnalyze.push({
          conversation,
          participant,
          messages,
          messageTexts
        });
      } else {
        console.log(`Not enough messages (${messages.length}/${MIN_MESSAGES_PER_CONTACT}) found for ${participant.username || 'Unknown'}`);
      }
    }
    
    console.log(`Analyzing ${conversationsToAnalyze.length} conversations with messages`);
    const analysisResults = await batchAnalyzeConversations(
      conversationsToAnalyze.map(({ messages, participant }) => ({
        messages,
        username: participant.username
      }))
    );
    
    const contacts: InstagramContact[] = [];
    
    for (let i = 0; i < conversationsToAnalyze.length; i++) {
      const { conversation, participant, messageTexts } = conversationsToAnalyze[i];
      const analysis = analysisResults[i];
      const lastMessage = conversation.messages?.data?.[0];
      
      const contactData = {
        id: participant.id,
        name: participant?.username || "Unknown",
        lastMessage: lastMessage?.message || "",
        timestamp: lastMessage?.created_time || conversation.updated_time,
        messages: messageTexts,
        ...analysis
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
          lastMessage: lastMessage?.message || null,
          lastMessageAt: lastMessage?.created_time ? new Date(lastMessage.created_time) : null,
          notes: existingContact?.notes || null,
          stage: analysis.stage,
          sentiment: analysis.sentiment,
          leadScore: analysis.leadScore,
          nextAction: analysis.nextAction,
          leadValue: analysis.leadValue,
          triggerMatched: existingContact?.triggerMatched || false,
          updatedAt: new Date(),
          createdAt: existingContact?.createdAt || new Date(),
        })
        .onConflictDoUpdate({
          target: contact.id,
          set: {
            username: participant.username,
            lastMessage: lastMessage?.message || undefined,
            lastMessageAt: lastMessage?.created_time ? new Date(lastMessage.created_time) : undefined,
            stage: analysis.stage,
            sentiment: analysis.sentiment,
            leadScore: analysis.leadScore,
            nextAction: analysis.nextAction,
            leadValue: analysis.leadValue,
            updatedAt: new Date(),
          },
        });
        
      console.log(`Updated contact in database: ${participant.username || 'Unknown'}`);
    }

    console.log(`Processed ${contacts.length} contacts in total`);
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