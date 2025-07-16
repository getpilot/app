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
    const { userId } = event.data;
    
    if (!userId) {
      throw new Error("No user ID provided");
    }
    
    await step.run("fetch-user", async () => {
      const userResult = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });
      
      if (!userResult) {
        throw new Error(`User not found: ${userId}`);
      }
      
      return userResult;
    });
    
    const contacts = await step.run("fetch-contacts", async () => {
      return await fetchAndStoreInstagramContacts(userId);
    });
    
    return {
      userId,
      contactsCount: contacts.length,
      success: true,
      contacts,
    };
  }
);