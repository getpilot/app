"use server";

import { db } from "@/lib/db";
import {
  automation,
  automationActionLog,
  contact,
  automationPost,
} from "@/lib/db/schema";
import { and, eq, desc, gt, isNull, or, ne } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export type Automation = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  triggerWord: string;
  responseType: "fixed" | "ai_prompt" | "generic_template";
  responseContent: string;
  isActive: boolean | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  triggerScope: "dm" | "comment" | "both" | null;
  commentReplyCount: number | null;
};

export type CreateAutomationData = {
  title: string;
  description?: string;
  triggerWord: string;
  responseType: "fixed" | "ai_prompt" | "generic_template";
  responseContent: string;
  expiresAt?: Date;
  triggerScope?: "dm" | "comment" | "both";
  postId?: string;
};

export type UpdateAutomationData = Partial<CreateAutomationData> & {
  isActive?: boolean;
};

export type AutomationLogItem = {
  id: string;
  userId: string;
  platform: "instagram";
  threadId: string;
  recipientId: string;
  recipientUsername: string;
  automationId: string;
  automationTitle: string;
  triggerWord: string;
  action: "automation_triggered" | "sent_reply";
  text: string | null;
  messageId: string | null;
  createdAt: Date | null;
};

export async function getAutomations(): Promise<Automation[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const automations = await db
    .select()
    .from(automation)
    .where(eq(automation.userId, user.id))
    .orderBy(desc(automation.createdAt));

  return automations;
}

export async function getAutomation(id: string): Promise<Automation | null> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await db
    .select()
    .from(automation)
    .where(and(eq(automation.id, id), eq(automation.userId, user.id)))
    .limit(1);

  return result[0] || null;
}

export async function createAutomation(
  data: CreateAutomationData
): Promise<Automation> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!data.triggerWord || data.triggerWord.trim().length === 0) {
    throw new Error("Trigger word is required");
  }

  if (data.triggerWord.length > 100) {
    throw new Error("Trigger word must be 100 characters or less");
  }

  if (!data.responseContent || data.responseContent.trim().length === 0) {
    throw new Error("Response content is required");
  }

  const existing = await db
    .select()
    .from(automation)
    .where(
      and(
        eq(automation.userId, user.id),
        eq(automation.triggerWord, data.triggerWord.toLowerCase())
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("An automation with this trigger word already exists");
  }

  const scope = data.triggerScope || "dm";
  if ((scope === "comment" || scope === "both") && !data.postId) {
    throw new Error("Post selection is required for comment/both scope");
  }

  const newAutomation: Automation = {
    id: crypto.randomUUID(),
    userId: user.id,
    title: data.title,
    description: data.description || null,
    triggerWord: data.triggerWord.toLowerCase(),
    responseType: data.responseType,
    responseContent: data.responseContent,
    isActive: true,
    expiresAt: data.expiresAt || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    triggerScope: scope,
    commentReplyCount: null,
  };

  await db.transaction(async (tx) => {
    await tx.insert(automation).values(newAutomation);
    if (scope !== "dm" && data.postId) {
      await tx.insert(automationPost).values({
        id: crypto.randomUUID(),
        automationId: newAutomation.id,
        postId: data.postId,
        createdAt: new Date(),
      });
    }
  });

  revalidatePath("/automations");
  return newAutomation as Automation;
}

export async function updateAutomation(
  id: string,
  data: UpdateAutomationData
): Promise<Automation> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const existing = await getAutomation(id);
  if (!existing) {
    throw new Error("Automation not found");
  }

  if (data.triggerWord !== undefined) {
    if (!data.triggerWord || data.triggerWord.trim().length === 0) {
      throw new Error("Trigger word is required");
    }

    if (data.triggerWord.length > 100) {
      throw new Error("Trigger word must be 100 characters or less");
    }

    const duplicate = await db
      .select()
      .from(automation)
      .where(
        and(
          eq(automation.userId, user.id),
          eq(automation.triggerWord, data.triggerWord.toLowerCase()),
          ne(automation.id, id)
        )
      )
      .limit(1);

    if (duplicate.length > 0) {
      throw new Error("An automation with this trigger word already exists");
    }
  }

  if (data.responseContent !== undefined) {
    if (!data.responseContent || data.responseContent.trim().length === 0) {
      throw new Error("Response content is required");
    }
  }

  const scope = data.triggerScope ?? existing.triggerScope ?? "dm";
  if ((scope === "comment" || scope === "both") && data.postId === undefined) {
    // require explicit postId presence on update for comment/both
    // caller must send postId
    throw new Error("Post selection is required for comment/both scope");
  }

  const updateData: Partial<typeof automation.$inferInsert> = {
    ...data,
    triggerWord: data.triggerWord?.toLowerCase(),
    updatedAt: new Date(),
  };

  await db.transaction(async (tx) => {
    await tx
      .update(automation)
      .set(updateData)
      .where(and(eq(automation.id, id), eq(automation.userId, user.id)));

    if (scope !== "dm") {
      // replace mapping with single row
      await tx
        .delete(automationPost)
        .where(eq(automationPost.automationId, id));
      if (data.postId) {
        await tx.insert(automationPost).values({
          id: crypto.randomUUID(),
          automationId: id,
          postId: data.postId,
          createdAt: new Date(),
        });
      }
    } else {
      // dm scope: ensure no mapping
      await tx
        .delete(automationPost)
        .where(eq(automationPost.automationId, id));
    }
  });

  revalidatePath("/automations");

  const updated = await getAutomation(id);
  if (!updated) {
    throw new Error("Failed to retrieve updated automation");
  }

  return updated;
}

export async function deleteAutomation(id: string): Promise<void> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const existing = await getAutomation(id);
  if (!existing) {
    throw new Error("Automation not found");
  }

  await db
    .delete(automation)
    .where(and(eq(automation.id, id), eq(automation.userId, user.id)));

  revalidatePath("/automations");
}

export async function toggleAutomation(id: string): Promise<Automation> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const existing = await getAutomation(id);
  if (!existing) {
    throw new Error("Automation not found");
  }

  return updateAutomation(id, { isActive: !existing.isActive });
}

export async function getActiveAutomations(
  userId: string
): Promise<Automation[]> {
  const automations = await db
    .select()
    .from(automation)
    .where(
      and(
        eq(automation.userId, userId),
        eq(automation.isActive, true),
        or(isNull(automation.expiresAt), gt(automation.expiresAt, new Date()))
      )
    );

  return automations;
}

export async function checkTriggerMatch(
  messageText: string,
  userId: string,
  scope: "dm" | "comment" = "dm"
): Promise<Automation | null> {
  const activeAutomations = await getActiveAutomations(userId);

  for (const a of activeAutomations) {
    const trigger = a.triggerWord?.toLowerCase?.() ?? "";
    if (!trigger) continue;

    const aScope = a.triggerScope || "dm";

    const scopeMatches =
      aScope === "both" || aScope === scope || (scope === "dm" && !aScope);

    if (scopeMatches && messageText.toLowerCase().includes(trigger)) {
      return a as Automation;
    }
  }

  return null;
}

export async function logAutomationUsage(params: {
  userId: string;
  platform: "instagram";
  threadId: string;
  recipientId: string;
  automationId: string;
  triggerWord: string;
  action: "automation_triggered" | "sent_reply";
  text?: string;
  messageId?: string;
}): Promise<void> {
  const {
    userId,
    platform,
    threadId,
    recipientId,
    automationId,
    triggerWord,
    action,
    text,
    messageId,
  } = params;

  await db.insert(automationActionLog).values({
    id: crypto.randomUUID(),
    userId,
    platform,
    threadId,
    recipientId,
    automationId,
    triggerWord,
    action,
    text: text ?? null,
    messageId,
    createdAt: new Date(),
  });
}

export async function getRecentAutomationLogs(
  limit: number = 25
): Promise<AutomationLogItem[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const logs = await db
    .select({
      id: automationActionLog.id,
      userId: automationActionLog.userId,
      platform: automationActionLog.platform,
      threadId: automationActionLog.threadId,
      recipientId: automationActionLog.recipientId,
      recipientUsername: contact.username,
      automationId: automationActionLog.automationId,
      triggerWord: automationActionLog.triggerWord,
      action: automationActionLog.action,
      text: automationActionLog.text,
      messageId: automationActionLog.messageId,
      createdAt: automationActionLog.createdAt,
      automationTitle: automation.title,
    })
    .from(automationActionLog)
    .leftJoin(automation, eq(automation.id, automationActionLog.automationId))
    .leftJoin(
      contact,
      and(
        eq(contact.id, automationActionLog.recipientId),
        eq(contact.userId, automationActionLog.userId)
      )
    )
    .where(eq(automationActionLog.userId, user.id))
    .orderBy(desc(automationActionLog.createdAt))
    .limit(limit);

  return logs.map((r) => ({
    ...r,
    recipientUsername: r.recipientUsername || r.recipientId,
  })) as AutomationLogItem[];
}