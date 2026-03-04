import { db } from "@pilot/db";
import {
  automation,
  billingUsageEvent,
  contact,
  sidekickActionLog,
} from "@pilot/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import type { BillingUsage } from "@/lib/billing/types";

export function getStartOfCurrentUtcMonth(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

async function countRows(source: any, whereClause?: any) {
  const query = db.select({
    count: sql<number>`count(*)::int`,
  }).from(source);

  const rows = whereClause ? await query.where(whereClause) : await query;
  return rows[0]?.count ?? 0;
}

export async function getCurrentUsage(
  userId: string,
  now: Date = new Date(),
): Promise<BillingUsage> {
  const monthStart = getStartOfCurrentUtcMonth(now);

  const [
    contactsTotal,
    newContactsThisMonth,
    automationsTotal,
    sidekickSendsThisMonth,
    sidekickChatPromptsThisMonth,
  ] = await Promise.all([
    countRows(contact, eq(contact.userId, userId)),
    countRows(
      contact,
      and(eq(contact.userId, userId), gte(contact.createdAt, monthStart)),
    ),
    countRows(automation, eq(automation.userId, userId)),
    countRows(
      sidekickActionLog,
      and(
        eq(sidekickActionLog.userId, userId),
        gte(sidekickActionLog.createdAt, monthStart),
      ),
    ),
    countRows(
      billingUsageEvent,
      and(
        eq(billingUsageEvent.userId, userId),
        eq(billingUsageEvent.kind, "sidekick_chat_prompt"),
        gte(billingUsageEvent.createdAt, monthStart),
      ),
    ),
  ]);

  return {
    contactsTotal,
    newContactsThisMonth,
    automationsTotal,
    sidekickSendsThisMonth,
    sidekickChatPromptsThisMonth,
  };
}

export async function recordSidekickChatPromptUsage(
  userId: string,
  referenceId?: string,
): Promise<string> {
  const eventId = crypto.randomUUID();

  await db.insert(billingUsageEvent).values({
    id: eventId,
    userId,
    kind: "sidekick_chat_prompt",
    referenceId: referenceId ?? null,
    createdAt: new Date(),
  });

  return eventId;
}

export async function rollbackSidekickChatPromptUsage(
  usageEventId: string,
): Promise<void> {
  await db
    .delete(billingUsageEvent)
    .where(eq(billingUsageEvent.id, usageEventId));
}
