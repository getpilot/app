import { inngest } from "./client";
import { fetchAndStoreInstagramContacts } from "@/actions/contacts";
import { api } from "../../../convex/_generated/api";
import { convex } from "../convex-client";

export const syncInstagramContacts = inngest.createFunction(
  {
    id: "sync-instagram-contacts",
    name: "Sync Instagram Contacts",
  },
  { event: "contacts/sync" },
  async ({ event, step, publish }) => {
    const { userId, fullSync = false } = event.data as {
      userId?: string;
      fullSync?: boolean;
    };

    if (!userId || typeof userId !== "string") {
      console.error("Invalid or missing user ID in event data", {
        eventData: event.data,
      });
      throw new Error("User ID must be a non-empty string");
    }
    console.log(`Starting Instagram contacts sync for user: ${userId}`);

    await step.run("fetch-user", async () => {
      console.log(`Fetching user data for ID: ${userId}`);

      const userResult = await convex.query(api.user.getUser, {
        id: userId as any, // Type assertion needed for Convex ID
      });

      if (!userResult) {
        console.log(`User not found: ${userId}`);
        throw new Error(`User not found: ${userId}`);
      }

      console.log(`Found user with ID: ${userResult._id}`);
    });

    console.log("Proceeding to fetch and analyze contacts");

    try {
      await publish({
        channel: `user:${userId}`,
        topic: "sync",
        data: { status: "started", fullSync: Boolean(fullSync) },
      });
    } catch (error) {
      console.error("Failed to publish sync started status:", error);
    }

    const contacts = await step.run("fetch-contacts", async () => {
      console.log(
        `Fetching contacts for user: ${userId} (fullSync=${Boolean(fullSync)})`
      );
      try {
        const contacts = await fetchAndStoreInstagramContacts(userId, {
          fullSync,
        });

        if (!Array.isArray(contacts)) {
          console.error(
            "Invalid contacts result: expected array but got",
            typeof contacts
          );
          return [];
        }

        console.log(`Fetched and processed ${contacts.length} contacts`);
        return contacts;
      } catch (error) {
        console.error("Error in fetchAndStoreInstagramContacts:", error);
        throw error;
      }
    });

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

    try {
      await publish({
        channel: `user:${userId}`,
        topic: "sync",
        data: { status: "completed", count: contacts.length },
      });
    } catch (error) {
      console.error("Failed to publish sync completed status:", error);
    }

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

// run every hour; function itself will decide who is due based on per-user intervals
export const scheduleContactsSync = inngest.createFunction(
  { id: "schedule-contacts-sync", name: "Schedule Contacts Sync" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const integrations = await step.run("load-integrations", async () => {
      const rows = await convex.query(
        api.instagram.getAllInstagramIntegrations
      );
      return rows;
    });

    const now = new Date();

    const due = integrations.filter((i: any) => {
      if (!i.accessToken) return false;
      const exp = i.expiresAt ? new Date(i.expiresAt) : null;
      if (exp && exp.getTime() < now.getTime()) {
        console.error(
          `instagram token expired; skipping scheduled sync for user ${i.userId}`
        );
        return false;
      }
      const interval = Math.min(24, Math.max(5, i.syncIntervalHours ?? 24));
      const last = i.lastSyncedAt ? new Date(i.lastSyncedAt) : null;
      if (!last) return true; // never synced -> due
      const next = new Date(last.getTime() + interval * 60 * 60 * 1000);
      return next <= now;
    });

    const events = await step.run("enqueue-due-syncs", async () => {
      if (due.length === 0)
        return [] as {
          name: string;
          data: { userId: string; fullSync: boolean };
        }[];
      const queued = due.map((integ: any) => ({
        name: "contacts/sync",
        data: { userId: integ.userId, fullSync: false },
      }));
      return queued;
    });

    if (events.length > 0) {
      await step.sendEvent("send-sync-events", events);
    }

    return { checked: integrations.length, scheduled: due.length };
  }
);