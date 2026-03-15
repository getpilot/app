"use server";

import {
  automation,
  automationActionLog,
  automationPost,
  contact,
} from "@pilot/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { getUser, getRLSDb } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { assertBillingAllowed } from "@/lib/billing/enforce";

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
  commentReplyText?: string | null;
  hrnEnforced?: boolean | null;
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
  commentReplyText?: string;
  hrnEnforced?: boolean;
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
  action:
    | "dm_automation_triggered"
    | "comment_automation_triggered"
    | "dm_and_comment_automation_triggered";
  text: string | null;
  messageId: string | null;
  createdAt: Date | null;
};

export async function getAutomations(): Promise<Automation[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const db = await getRLSDb();
  return db
    .select()
    .from(automation)
    .where(eq(automation.userId, user.id))
    .orderBy(desc(automation.createdAt));
}

export async function getAutomation(id: string): Promise<Automation | null> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const db = await getRLSDb();
  const result = await db
    .select()
    .from(automation)
    .where(and(eq(automation.id, id), eq(automation.userId, user.id)))
    .limit(1);

  return result[0] || null;
}

export async function getAutomationPostId(
  automationId: string,
): Promise<string | null> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const db = await getRLSDb();
  const result = await db
    .select()
    .from(automationPost)
    .where(eq(automationPost.automationId, automationId))
    .limit(1);

  if (result[0] && typeof result[0].postId === "string") {
    return result[0].postId;
  }

  return null;
}

export async function createAutomation(
  data: CreateAutomationData,
): Promise<Automation> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await assertBillingAllowed(user.id, "automation:create");

  if (!data.triggerWord || data.triggerWord.trim().length === 0) {
    throw new Error("Trigger word is required");
  }

  if (data.triggerWord.length > 100) {
    throw new Error("Trigger word must be 100 characters or less");
  }

  if (!data.responseContent || data.responseContent.trim().length === 0) {
    throw new Error("Response content is required");
  }

  const db = await getRLSDb();
  const existing = await db
    .select()
    .from(automation)
    .where(
      and(
        eq(automation.userId, user.id),
        eq(automation.triggerWord, data.triggerWord.toLowerCase()),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("An automation with this trigger word already exists");
  }

  const scope = data.triggerScope || "dm";
  if ((scope === "comment" || scope === "both") && !data.postId) {
    throw new Error("Post selection is required for comment/both scope");
  }

  const wantPublicComment =
    (scope === "comment" || scope === "both") &&
    data.commentReplyText !== undefined;
  const trimmedPublic = data.commentReplyText?.trim() ?? "";
  const publicCommentText =
    wantPublicComment && trimmedPublic.length > 0 ? trimmedPublic : undefined;

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
    commentReplyText: publicCommentText ?? null,
    hrnEnforced: data.hrnEnforced ?? false,
  };

  await db.insert(automation).values(newAutomation);

  if (scope !== "dm" && data.postId) {
    await db.insert(automationPost).values({
      id: crypto.randomUUID(),
      automationId: newAutomation.id,
      postId: data.postId,
      createdAt: new Date(),
    });
  }

  revalidatePath("/automations");
  return newAutomation;
}

export async function updateAutomation(
  id: string,
  data: UpdateAutomationData,
): Promise<Automation> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await assertBillingAllowed(user.id, "automation:mutate");

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

    const db = await getRLSDb();
    const duplicate = await db
      .select()
      .from(automation)
      .where(
        and(
          eq(automation.userId, user.id),
          eq(automation.triggerWord, data.triggerWord.toLowerCase()),
          ne(automation.id, id),
        ),
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
    throw new Error("Post selection is required for comment/both scope");
  }

  let commentReplyText: string | null | undefined = data.commentReplyText;
  if (scope === "comment" || scope === "both") {
    if (commentReplyText !== undefined) {
      const trimmed = (commentReplyText ?? "").trim();
      commentReplyText = trimmed.length > 0 ? trimmed : null;
    }
  } else {
    commentReplyText = commentReplyText !== undefined ? null : undefined;
  }

  const updateDataBase: Partial<typeof automation.$inferInsert> = {
    ...data,
    triggerWord: data.triggerWord?.toLowerCase(),
    updatedAt: new Date(),
  };
  const updateData: Partial<typeof automation.$inferInsert> & {
    commentReplyText?: string | null;
  } = {
    ...updateDataBase,
    ...(commentReplyText !== undefined ? { commentReplyText } : {}),
  };

  const db = await getRLSDb();
  await db.update(automation).set(updateData).where(eq(automation.id, id));

  await db.delete(automationPost).where(eq(automationPost.automationId, id));
  if (scope !== "dm" && data.postId) {
    await db.insert(automationPost).values({
      id: crypto.randomUUID(),
      automationId: id,
      postId: data.postId,
      createdAt: new Date(),
    });
  }

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

  await assertBillingAllowed(user.id, "automation:mutate");

  const existing = await getAutomation(id);
  if (!existing) {
    throw new Error("Automation not found");
  }

  const db = await getRLSDb();
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

export async function getRecentAutomationLogs(
  limit: number = 25,
): Promise<AutomationLogItem[]> {
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const db = await getRLSDb();
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
        eq(contact.userId, automationActionLog.userId),
      ),
    )
    .where(eq(automationActionLog.userId, user.id))
    .orderBy(desc(automationActionLog.createdAt))
    .limit(safeLimit);

  return logs.map((row) => ({
    ...row,
    recipientUsername: row.recipientUsername || row.recipientId,
  })) as AutomationLogItem[];
}
