import { inngest } from "./client";
import { fetchAndStoreInstagramContacts } from "@/actions/contacts";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const syncInstagramContacts = inngest.createFunction(
  {
    id: "sync-instagram-contacts",
    name: "Sync Instagram Contacts",
  },
  { event: "contacts/sync" },
  async ({ event, step }) => {
    const { userId, fullSync } = event.data as { userId?: string; fullSync?: boolean };

    if (!userId || typeof userId !== "string") {
      console.error("Invalid or missing user ID in event data", {
        eventData: event.data,
      });
      throw new Error("User ID must be a non-empty string");
    }
    console.log(`Starting Instagram contacts sync for user: ${userId}`);

    await step.run("fetch-user", async () => {
      console.log(`Fetching user data for ID: ${userId}`);
      const userResult = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!userResult) {
        console.log(`User not found: ${userId}`);
        throw new Error(`User not found: ${userId}`);
      }

      console.log(`Found user with ID: ${userResult.id}`);
    });

    console.log("Proceeding to fetch and analyze contacts");
    const contacts = await step.run("fetch-contacts", async () => {
      console.log(`Fetching contacts for user: ${userId} (fullSync=${Boolean(fullSync)})`);
      try {
        const contacts = await fetchAndStoreInstagramContacts(userId, { fullSync });
        
        if (!Array.isArray(contacts)) {
          console.error("Invalid contacts result: expected array but got", typeof contacts);
          return [];
        }
        
        console.log(`Fetched and processed ${contacts.length} contacts`);
        return contacts;
      } catch (error) {
        console.error("Error in fetchAndStoreInstagramContacts:", error);
        throw error;
      }
    });

    if (!Array.isArray(contacts)) {
      console.error("Invalid contacts data: expected array but got", typeof contacts);
      return {
        userId,
        contactsCount: 0,
        success: false,
        contacts: [],
        stageDistribution: {},
        sentimentDistribution: {},
        averageLeadScore: 0,
        averageLeadValue: 0,
      };
    }

    console.log("Contact analysis summary:");
    const stageDistribution = contacts.reduce(
      (acc: Record<string, number>, contact) => {
        const stage = contact.stage || "unknown";
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      },
      {}
    );

    const sentimentDistribution = contacts.reduce(
      (acc: Record<string, number>, contact) => {
        const sentiment = contact.sentiment || "unknown";
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      },
      {}
    );

    const averageLeadScore = contacts.length
      ? contacts.reduce((sum, contact) => sum + (contact.leadScore || 0), 0) /
        contacts.length
      : 0;

    const averageLeadValue = contacts.length
      ? contacts.reduce((sum, contact) => sum + (contact.leadValue || 0), 0) /
        contacts.length
      : 0;

    console.log(`Stage distribution:`, stageDistribution);
    console.log(`Sentiment distribution:`, sentimentDistribution);
    console.log(`Average lead score: ${averageLeadScore.toFixed(2)}`);
    console.log(`Average lead value: ${averageLeadValue.toFixed(2)}`);

    return {
      userId,
      contactsCount: contacts.length,
      success: true,
      contacts,
      stageDistribution,
      sentimentDistribution,
      averageLeadScore,
      averageLeadValue,
    };
  }
);