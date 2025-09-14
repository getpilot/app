"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { Id } from "../../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

export async function listActionLogs(limit: number = 20) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const logs = await convex.query(api.sidekick.getSidekickActionLogs, {
      userId: toUserId(currentUser._id),
    });

    return {
      success: true,
      logs: logs.slice(0, limit).map((log: any) => ({
        id: log._id,
        platform: log.platform,
        threadId: log.threadId,
        recipientId: log.recipientId,
        action: log.action,
        text: log.text,
        result: log.result,
        createdAt: new Date(log.createdAt).toISOString(),
        messageId: log.messageId,
        recipientUsername: log.recipientId, // Convex doesn't have recipientUsername field
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

    const logs = await convex.query(api.sidekick.getSidekickActionLogs, {
      userId: toUserId(currentUser._id),
    });

    const log = logs.find((l: any) => l._id === actionId);

    if (!log) {
      return { success: false, error: "Action log not found" };
    }

    return {
      success: true,
      log: {
        id: log._id,
        platform: log.platform,
        threadId: log.threadId,
        recipientId: log.recipientId,
        action: log.action,
        text: log.text,
        result: log.result,
        createdAt: new Date(log.createdAt).toISOString(),
        messageId: log.messageId,
        recipientUsername: log.recipientUsername || log.recipientId,
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