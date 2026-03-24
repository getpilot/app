"use server";

import { getRLSDb, getUser } from "@/lib/auth-utils";
import { enqueueActiveThreadBackfill, enqueueBusinessKnowledgeSync } from "@/lib/supermemory/events";
import { contact, userToneProfile } from "@pilot/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getSidekickMemoryOverview() {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" } as const;
    }

    const db = await getRLSDb();
    const [toneProfile, totals] = await Promise.all([
      db.query.userToneProfile.findFirst({
        where: eq(userToneProfile.userId, user.id),
      }),
      db
        .select({
          totalContacts: sql<number>`count(*)::int`,
          seededContacts:
            sql<number>`count(*) filter (where ${contact.memorySeededAt} is not null)::int`,
        })
        .from(contact)
        .where(eq(contact.userId, user.id))
        .then((rows) => rows[0] ?? { totalContacts: 0, seededContacts: 0 }),
    ]);

    return {
      success: true,
      overview: {
        toneType: toneProfile?.toneType || "friendly",
        toneSamples: toneProfile?.sampleText?.length || 0,
        totalContacts: totals.totalContacts,
        seededContacts: totals.seededContacts,
      },
    } as const;
  } catch (error) {
    console.error("Error fetching sidekick memory overview:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch sidekick memory overview",
    } as const;
  }
}

export async function syncSidekickMemory() {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" } as const;
    }

    await Promise.all([
      enqueueBusinessKnowledgeSync(user.id, "syncSidekickMemory"),
      enqueueActiveThreadBackfill(user.id, "syncSidekickMemory"),
    ]);

    return { success: true } as const;
  } catch (error) {
    console.error("Error syncing sidekick memory:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to sync sidekick memory",
    } as const;
  }
}
