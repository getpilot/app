"use server";

import { getUser, getRLSDb } from "@/lib/auth-utils";
import { sidekickActionLog, contact } from "@pilot/db/schema";
import { desc, eq } from "drizzle-orm";

export async function listActionLogs(limit: number = 20) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getRLSDb();
    const logs = await db
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
      .leftJoin(contact, eq(contact.id, sidekickActionLog.recipientId))
      .orderBy(desc(sidekickActionLog.createdAt))
      .limit(limit);

    return {
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        platform: log.platform,
        threadId: log.threadId,
        recipientId: log.recipientId,
        action: log.action,
        text: log.text,
        result: log.result,
        createdAt: String(log.createdAt),
        messageId: log.messageId,
        recipientUsername: log.recipientUsername || log.recipientId,
      })),
    };
  } catch (error) {
    console.error("Error fetching action logs:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch action logs",
    };
  }
}

export async function getActionLog(actionId: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getRLSDb();
    const log = await db
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
      .leftJoin(contact, eq(contact.id, sidekickActionLog.recipientId))
      .where(eq(sidekickActionLog.id, actionId))
      .limit(1);

    if (log.length === 0) {
      return { success: false, error: "Action log not found" };
    }

    const actionLog = log[0];
    return {
      success: true,
      log: {
        id: actionLog.id,
        platform: actionLog.platform,
        threadId: actionLog.threadId,
        recipientId: actionLog.recipientId,
        action: actionLog.action,
        text: actionLog.text,
        result: actionLog.result,
        createdAt: String(actionLog.createdAt),
        messageId: actionLog.messageId,
        recipientUsername: actionLog.recipientUsername || actionLog.recipientId,
      },
    };
  } catch (error) {
    console.error("Error fetching action log:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch action log",
    };
  }
}
