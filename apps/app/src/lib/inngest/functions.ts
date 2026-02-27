import { inngest } from "./client";
import { fetchAndStoreInstagramContacts } from "@/actions/contacts";
import type { InstagramContact } from "@pilot/types/instagram";
import { db } from "@pilot/db";
import { user, instagramIntegration } from "@pilot/db/schema";
import { eq, lt } from "drizzle-orm";

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
        console.log(
          `Fetching contacts for user: ${userId} (fullSync=${Boolean(fullSync)})`,
        );
        try {
          const contacts = await fetchAndStoreInstagramContacts(userId, {
            fullSync,
          });

          if (!Array.isArray(contacts)) {
            console.error(
              "Invalid contacts result: expected array but got",
              typeof contacts,
            );
            return { contacts: [], error: "Invalid contacts result" };
          }

          console.log(`Fetched and processed ${contacts.length} contacts`);
          return { contacts };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error(
            "Error in fetchAndStoreInstagramContacts:",
            errorMessage,
          );

          if (
            error instanceof Error &&
            error.message.includes("token expired")
          ) {
            console.error(
              `Instagram token expired for user ${userId}. Sync will be skipped until reconnection.`,
            );

            return { contacts: [], error: "token_expired" };
          }

          return { contacts: [], error: errorMessage };
        }
      },
    );

    if (contactsResult.error) {
      try {
        if (contactsResult.error === "token_expired") {
          await step.sendEvent("sync-failed", {
            name: "sync/status",
            data: {
              userId,
              status: "failed",
              error:
                "Instagram token expired. Please reconnect your Instagram account.",
              fullSync: Boolean(fullSync),
            },
          });
        } else {
          await step.sendEvent("sync-failed", {
            name: "sync/status",
            data: {
              userId,
              status: "failed",
              error: contactsResult.error,
              fullSync: Boolean(fullSync),
            },
          });
        }
      } catch (sendError) {
        console.error("Failed to send sync failed status:", sendError);
      }

      return {
        userId,
        contactsCount: 0,
        success: false,
        contacts: [],
        error: contactsResult.error,
      } as const;
    }

    const contacts = contactsResult.contacts;

    console.log("Contact analysis summary:");
    const stageDistribution = contacts.reduce(
      (acc: Record<string, number>, contact: InstagramContact) => {
        const stage = contact.stage || "unknown";
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      },
      {},
    );

    const sentimentDistribution = contacts.reduce(
      (acc: Record<string, number>, contact: InstagramContact) => {
        const sentiment = contact.sentiment || "unknown";
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      },
      {},
    );

    const averageLeadScore = contacts.length
      ? contacts.reduce(
          (sum: number, contact: InstagramContact) =>
            sum + (contact.leadScore || 0),
          0,
        ) / contacts.length
      : 0;

    const averageLeadValue = contacts.length
      ? contacts.reduce(
          (sum: number, contact: InstagramContact) =>
            sum + (contact.leadValue || 0),
          0,
        ) / contacts.length
      : 0;

    console.log(`Stage distribution:`, stageDistribution);
    console.log(`Sentiment distribution:`, sentimentDistribution);
    console.log(`Average lead score: ${averageLeadScore.toFixed(2)}`);
    console.log(`Average lead value: ${averageLeadValue.toFixed(2)}`);

    try {
      await step.sendEvent("sync-completed", {
        name: "sync/status",
        data: {
          userId,
          status: "completed",
          count: contacts.length,
        },
      });
    } catch (error) {
      console.error("Failed to send sync completed event:", error);
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
  },
);

// run every hour; function itself will decide who is due based on per-user intervals
export const scheduleContactsSync = inngest.createFunction(
  { id: "schedule-contacts-sync", name: "Schedule Contacts Sync" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const integrations = await step.run("load-integrations", async () => {
      const rows = await db.query.instagramIntegration.findMany({});
      return rows;
    });

    const now = new Date();

    const due = integrations.filter((i) => {
      if (!i.accessToken) return false;
      const exp = i.expiresAt ? new Date(i.expiresAt) : null;
      if (exp && exp.getTime() < now.getTime()) {
        console.error(
          `instagram token expired; skipping scheduled sync for user ${i.userId}`,
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
      const queued = due.map((integ) => ({
        name: "contacts/sync",
        data: { userId: integ.userId, fullSync: false },
      }));
      return queued;
    });

    if (events.length > 0) {
      await step.sendEvent("send-sync-events", events);
    }

    return { checked: integrations.length, scheduled: due.length };
  },
);

// ── Token Refresh ──────────────────────────────────────────────────
// Refresh Instagram long-lived tokens 7 days before they expire.
// Runs daily at 3 AM UTC.
export const refreshInstagramTokens = inngest.createFunction(
  { id: "refresh-instagram-tokens", name: "Refresh Instagram Tokens" },
  { cron: "0 3 * * *" },
  async ({ step }) => {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const expiringIntegrations = await step.run(
      "find-expiring-tokens",
      async () => {
        return db.query.instagramIntegration.findMany({
          where: lt(instagramIntegration.expiresAt, sevenDaysFromNow),
        });
      },
    );

    let refreshed = 0;
    let failed = 0;

    for (const integ of expiringIntegrations) {
      const result = await step.run(`refresh-token-${integ.id}`, async () => {
        try {
          const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(integ.accessToken)}`;
          const res = await fetch(url);
          const data = (await res.json()) as {
            access_token?: string;
            expires_in?: number;
            error?: unknown;
          };

          if (!res.ok || !data.access_token || !data.expires_in) {
            console.error("token.refresh_failed", {
              userId: integ.userId,
              integrationId: integ.id,
              status: res.status,
              error: data.error ?? "missing fields in response",
            });
            return { success: false } as const;
          }

          const newExpiresAt = new Date();
          newExpiresAt.setSeconds(newExpiresAt.getSeconds() + data.expires_in);

          await db
            .update(instagramIntegration)
            .set({
              accessToken: data.access_token,
              expiresAt: newExpiresAt,
              updatedAt: new Date(),
            })
            .where(eq(instagramIntegration.id, integ.id));

          console.log("token.refreshed", {
            userId: integ.userId,
            integrationId: integ.id,
            newExpiresAt: newExpiresAt.toISOString(),
          });
          return { success: true } as const;
        } catch (error) {
          console.error("token.refresh_failed", {
            userId: integ.userId,
            integrationId: integ.id,
            error: error instanceof Error ? error.message : "unknown error",
          });
          return { success: false } as const;
        }
      });

      if (result.success) {
        refreshed++;
      } else {
        failed++;
      }
    }

    return {
      checked: expiringIntegrations.length,
      refreshed,
      failed,
    };
  },
);

