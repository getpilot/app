"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { Id } from "../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

export type RecentSidekickAction = {
  id: string;
  userId: string;
  platform: "instagram";
  threadId: string;
  recipientId: string;
  action: "sent_reply";
  text: string;
  result: "sent" | "failed";
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

  const logs = await convex.query(api.sidekick.getSidekickActionLogs, {
    userId: toUserId(user._id),
  });

  return logs.slice(0, 10).map((log: any) => ({
    id: log._id,
    userId: log.userId,
    platform: log.platform,
    threadId: log.threadId,
    recipientId: log.recipientId,
    action: log.action,
    text: log.text,
    result: log.result,
    createdAt: new Date(log.createdAt).toISOString(),
    messageId: log.messageId ?? null,
    recipientUsername: log.recipientUsername || log.recipientId,
  }));
}