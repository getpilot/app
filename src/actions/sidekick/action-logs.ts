"use server";

import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sidekickActionLog, contact } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type RecentSidekickAction = {
  id: string;
  userId: string;
  platform: "instagram";
  threadId: string;
  recipientId: string;
  action: "sent_reply" | "follow_up_sent";
  text: string;
  result: "sent";
  createdAt: string;
  messageId: string | null;
  recipientUsername: string;
};

export async function getRecentSidekickActions(): Promise<
  RecentSidekickAction[]
> {
  const user = await getUser();
  if (!user) {
    return [];
  }

  const rows = await db
    .select({
      id: sidekickActionLog.id,
      userId: sidekickActionLog.userId,
      platform: sidekickActionLog.platform,
      threadId: sidekickActionLog.threadId,
      recipientId: sidekickActionLog.recipientId,
      action: sidekickActionLog.action,
      text: sidekickActionLog.text,
      result: sidekickActionLog.result,
      createdAt: sidekickActionLog.createdAt,
      messageId: sidekickActionLog.messageId,
      recipientUsername: contact.username,
    })
    .from(sidekickActionLog)
    .leftJoin(
      contact,
      and(
        eq(contact.id, sidekickActionLog.recipientId),
        eq(contact.userId, sidekickActionLog.userId)
      )
    )
    .where(eq(sidekickActionLog.userId, user.id))
    .orderBy(desc(sidekickActionLog.createdAt))
    .limit(10);

  return rows.map((r) => ({
    ...r,
    createdAt: String(r.createdAt),
    messageId: r.messageId ?? null,
    recipientUsername: r.recipientUsername || r.recipientId,
  }));
}