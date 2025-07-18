"use server";

import axios from "axios";
import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { contact, instagramIntegration } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

type GeminiAnalysisResult = {
  stage: string;
  sentiment: string;
  leadScore: number;
  nextAction: string;
  leadValue: number;
};

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

export async function analyzeConversationWithGemini(messages: InstagramMessage[], username: string): Promise<GeminiAnalysisResult> {
  try {
    console.log(`Analyzing conversation with ${username} using Gemini AI`);
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const formattedMessages = messages.map(msg => {
      const sender = msg.from.username === username ? "Customer" : "Business";
      return `${sender}: ${msg.message}`;
    }).join("\n");

    const prompt = `
    Analyze this Instagram conversation between a business and a potential customer:
    
    ${formattedMessages}
    
    Based on this conversation, provide the following information in JSON format:
    1. stage: The stage of the lead ("new", "lead", "follow-up", or "ghosted")
    2. sentiment: The customer sentiment ("hot", "warm", "cold", "neutral", or "ghosted")
    3. leadScore: A numerical score from 0-100 indicating lead quality
    4. nextAction: A brief recommendation for the next action to take with this lead
    5. leadValue: A numerical estimate (0-1000) of the potential value of this lead
    
    Return ONLY valid JSON with these fields.
    `;

    console.log("Sending prompt to Gemini AI");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Received response from Gemini AI:", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response");
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    console.log("Parsed analysis:", analysis);
    
    return {
      stage: analysis.stage || "new",
      sentiment: analysis.sentiment || "neutral",
      leadScore: analysis.leadScore || 0,
      nextAction: analysis.nextAction || "",
      leadValue: analysis.leadValue || 0,
    };
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
    const conversations = data.data || [];
    console.log(`Found ${conversations.length} conversations`);

    const contacts: InstagramContact[] = [];

    for (const conversation of conversations) {
      const participant = conversation.participants.data.find(
        (p: InstagramParticipant) => p.username !== integration.username
      );

      const lastMessage = conversation.messages?.data?.[0];
      
      if (!participant?.id) {
        console.log("Skipping conversation with no participant ID");
        continue;
      }
      
      console.log(`Processing contact: ${participant.username || 'Unknown'} (${participant.id})`);
      
      const messages = await fetchConversationMessages(integration.accessToken, conversation.id);
      
      const messageTexts = messages.map(msg => `${msg.from.username}: ${msg.message}`);
      
      let analysis = {
        stage: "new",
        sentiment: "neutral",
        leadScore: 0,
        nextAction: "",
        leadValue: 0,
      };
      
      if (messages.length > 0) {
        console.log(`Analyzing ${messages.length} messages for ${participant.username || 'Unknown'}`);
        analysis = await analyzeConversationWithGemini(messages, participant.username);
      }
      
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