import { db } from "@pilot/db";
import { instagramIntegration, user } from "@pilot/db/schema";
import { eq } from "drizzle-orm";
import type { InstagramContact } from "@pilot/types/instagram";
import {
  fetchAndStoreInstagramContacts,
  getDueSyncIntegrations,
  getExpiringIntegrations,
  refreshInstagramTokenIfExpiring,
  summarizeContacts,
} from "@pilot/core/contacts/sync";
import { inngest } from "./client";

export const syncInstagramContacts = inngest.createFunction(
  {
    id: "sync-instagram-contacts",
    name: "Sync Instagram Contacts",
  },
  { event: "contacts/sync" },
  async ({ event, step }) => {
    const { userId, fullSync = false } = event.data as {
      userId?: string;
      fullSync?: boolean;
    };

    if (!userId || typeof userId !== "string") {
      throw new Error("User ID must be a non-empty string");
    }

    await step.run("fetch-user", async () => {
      const userResult = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!userResult) {
        throw new Error(`User not found: ${userId}`);
      }
    });

    try {
      await step.sendEvent("sync-started", {
        name: "sync/status",
        data: {
          userId,
          status: "started",
          fullSync: Boolean(fullSync),
        },
      });
    } catch (error) {
      console.error("Failed to send sync started event:", error);
    }

    type ContactsResult = { contacts: InstagramContact[]; error?: string };
    const contactsResult = await step.run(
      "fetch-contacts",
      async (): Promise<ContactsResult> => {
        try {
          const contacts = await fetchAndStoreInstagramContacts({
            dbClient: db,
            userId,
            fullSync,
          });

          if (!Array.isArray(contacts)) {
            return { contacts: [], error: "Invalid contacts result" };
          }

          return { contacts };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          if (message.includes("token expired")) {
            return { contacts: [], error: "token_expired" };
          }
          return { contacts: [], error: message };
        }
      },
    );

    if (contactsResult.error) {
      try {
        await step.sendEvent("sync-failed", {
          name: "sync/status",
          data: {
            userId,
            status: "failed",
            error:
              contactsResult.error === "token_expired"
                ? "Instagram token expired. Please reconnect your Instagram account."
                : contactsResult.error,
            fullSync: Boolean(fullSync),
          },
        });
      } catch (error) {
        console.error("Failed to send sync failed status:", error);
      }

      return {
        userId,
        contactsCount: 0,
        success: false,
        contacts: [],
        error: contactsResult.error,
      } as const;
    }

    const summary = summarizeContacts(contactsResult.contacts);

    try {
      await step.sendEvent("sync-completed", {
        name: "sync/status",
        data: {
          userId,
          status: "completed",
          count: contactsResult.contacts.length,
        },
      });
    } catch (error) {
      console.error("Failed to send sync completed event:", error);
    }

    return {
      userId,
      contactsCount: contactsResult.contacts.length,
      success: true,
      contacts: contactsResult.contacts,
      ...summary,
    };
  },
);

export const scheduleContactsSync = inngest.createFunction(
  { id: "schedule-contacts-sync", name: "Schedule Contacts Sync" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const integrations = await step.run("load-integrations", async () => {
      return db.query.instagramIntegration.findMany({});
    });

    const due = getDueSyncIntegrations(integrations);

    const events = await step.run("enqueue-due-syncs", async () => {
      if (due.length === 0) {
        return [] as Array<{
          name: string;
          data: { userId: string; fullSync: boolean };
        }>;
      }

      return due.map((integration) => ({
        name: "contacts/sync",
        data: { userId: integration.userId, fullSync: false },
      }));
    });

    if (events.length > 0) {
      await step.sendEvent("send-sync-events", events);
    }

    return { checked: integrations.length, scheduled: due.length };
  },
);

export const refreshInstagramTokens = inngest.createFunction(
  { id: "refresh-instagram-tokens", name: "Refresh Instagram Tokens" },
  { cron: "0 3 * * *" },
  async ({ step }) => {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const expiringIntegrations = await step.run("find-expiring-tokens", async () => {
      return getExpiringIntegrations(db, sevenDaysFromNow);
    });

    let refreshed = 0;
    let failed = 0;

    for (const integration of expiringIntegrations) {
      const result = await step.run(`refresh-token-${integration.id}`, async () => {
        try {
          await refreshInstagramTokenIfExpiring({
            dbClient: db,
            integration,
          });
          return { success: true } as const;
        } catch (error) {
          console.error("token.refresh_failed", {
            userId: integration.userId,
            integrationId: integration.id,
            error: error instanceof Error ? error.message : "unknown error",
          });
          return { success: false } as const;
        }
      });

      if (result.success) {
        refreshed += 1;
      } else {
        failed += 1;
      }
    }

    return {
      checked: expiringIntegrations.length,
      refreshed,
      failed,
    };
  },
);
