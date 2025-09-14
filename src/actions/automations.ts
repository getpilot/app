"use server";

import { convex, api } from "@/lib/convex-client";
import { getUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { Id } from "../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;
const toAutomationId = (id: string): Id<"automation"> => id as Id<"automation">;
const toContactId = (id: string): Id<"contact"> => id as Id<"contact">;

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

  const automations = await convex.query(
    api.automations.getAutomationsByUserId,
    {
      userId: toUserId(user.id),
    }
  );

  return automations.map((a) => ({
    id: a._id,
    userId: a.userId,
    title: a.title,
    description: a.description || null,
    triggerWord: a.triggerWord,
    responseType: a.responseType,
    responseContent: a.responseContent,
    isActive: a.isActive || null,
    expiresAt: a.expiresAt ? new Date(a.expiresAt) : null,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
    triggerScope: a.triggerScope || null,
    commentReplyCount: a.commentReplyCount || null,
    commentReplyText: a.commentReplyText || null,
  }));
}

export async function getAutomation(id: string): Promise<Automation | null> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const automation = await convex.query(api.automations.getAutomation, {
    id: toAutomationId(id),
  });

  if (!automation || automation.userId !== user.id) {
    return null;
  }

  return {
    id: automation._id,
    userId: automation.userId,
    title: automation.title,
    description: automation.description || null,
    triggerWord: automation.triggerWord,
    responseType: automation.responseType,
    responseContent: automation.responseContent,
    isActive: automation.isActive || null,
    expiresAt: automation.expiresAt ? new Date(automation.expiresAt) : null,
    createdAt: new Date(automation.createdAt),
    updatedAt: new Date(automation.updatedAt),
    triggerScope: automation.triggerScope || null,
    commentReplyCount: automation.commentReplyCount || null,
    commentReplyText: automation.commentReplyText || null,
  };
}

export async function getAutomationPostId(
  automationId: string
): Promise<string | null> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const posts = await convex.query(
    api.automation_posts.getAutomationPostsByAutomationId,
    {
      automationId: toAutomationId(automationId),
    }
  );

  if (posts && posts[0] && typeof posts[0].postId === "string") {
    return posts[0].postId;
  }
  return null;
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

  const existing = await convex.query(
    api.automations.getAutomationByTriggerWord,
    {
      userId: toUserId(user.id),
      triggerWord: data.triggerWord.toLowerCase(),
    }
  );

  if (existing) {
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

  const now = Date.now();
  const automationId = await convex.mutation(api.automations.createAutomation, {
    userId: toUserId(user.id),
    title: data.title,
    description: data.description,
    triggerWord: data.triggerWord.toLowerCase(),
    responseType: data.responseType,
    responseContent: data.responseContent,
    isActive: true,
    expiresAt: data.expiresAt ? data.expiresAt.getTime() : undefined,
    createdAt: now,
    updatedAt: now,
    triggerScope: scope,
    commentReplyCount: undefined,
    commentReplyText: publicCommentText,
  });

  if (scope !== "dm" && data.postId) {
    await convex.mutation(api.automation_posts.createAutomationPost, {
      automationId: automationId,
      postId: data.postId,
      createdAt: now,
    });
  }

  revalidatePath("/automations");

  return {
    id: automationId,
    userId: user.id,
    title: data.title,
    description: data.description || null,
    triggerWord: data.triggerWord.toLowerCase(),
    responseType: data.responseType,
    responseContent: data.responseContent,
    isActive: true,
    expiresAt: data.expiresAt || null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    triggerScope: scope,
    commentReplyCount: null,
    commentReplyText: publicCommentText ?? null,
  };
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

    const duplicate = await convex.query(
      api.automations.getAutomationByTriggerWord,
      {
        userId: toUserId(user.id),
        triggerWord: data.triggerWord.toLowerCase(),
      }
    );

    if (duplicate && duplicate._id !== id) {
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

  let commentReplyText: string | null | undefined = data.commentReplyText;
  if (scope === "comment" || scope === "both") {
    if (commentReplyText !== undefined) {
      const trimmed = (commentReplyText ?? "").trim();
      commentReplyText = trimmed.length > 0 ? trimmed : null; // normalize empty to null
    }
  } else {
    // for DM-only scope, always null out any existing public reply text
    commentReplyText = commentReplyText !== undefined ? null : undefined;
  }

  const now = Date.now();
  const updateData: {
    title?: string;
    description?: string;
    triggerWord?: string;
    responseType?: "fixed" | "ai_prompt" | "generic_template";
    responseContent?: string;
    isActive?: boolean;
    triggerScope?: "dm" | "comment" | "both";
    commentReplyText?: string;
    updatedAt: number;
  } = {
    ...data,
    triggerWord: data.triggerWord?.toLowerCase(),
    updatedAt: now,
  };

  if (commentReplyText !== undefined) {
    updateData.commentReplyText = commentReplyText ?? undefined;
  }

  await convex.mutation(api.automations.updateAutomation, {
    id: toAutomationId(id),
    ...updateData,
  });

  if (scope !== "dm") {
    await convex.mutation(
      api.automation_posts.deleteAutomationPostsByAutomationId,
      {
        automationId: toAutomationId(id),
      }
    );
    if (data.postId) {
      await convex.mutation(api.automation_posts.createAutomationPost, {
        automationId: toAutomationId(id),
        postId: data.postId,
        createdAt: now,
      });
    }
  } else {
    await convex.mutation(
      api.automation_posts.deleteAutomationPostsByAutomationId,
      {
        automationId: toAutomationId(id),
      }
    );
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

  const existing = await getAutomation(id);
  if (!existing) {
    throw new Error("Automation not found");
  }

  await convex.mutation(api.automations.deleteAutomation, {
    id: toAutomationId(id),
  });

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

  await convex.mutation(api.automations.toggleAutomation, {
    id: toAutomationId(id),
    isActive: !existing.isActive,
    updatedAt: Date.now(),
  });

  revalidatePath("/automations");
  return updateAutomation(id, { isActive: !existing.isActive });
}

export async function getActiveAutomations(
  userId: string
): Promise<Automation[]> {
  const automations = await convex.query(
    api.automations.getActiveAutomationsByUserIdAndScope,
    {
      userId: toUserId(userId),
    }
  );

  return automations.map((a) => ({
    id: a._id,
    userId: a.userId,
    title: a.title,
    description: a.description || null,
    triggerWord: a.triggerWord,
    responseType: a.responseType,
    responseContent: a.responseContent,
    isActive: a.isActive || null,
    expiresAt: a.expiresAt ? new Date(a.expiresAt) : null,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
    triggerScope: a.triggerScope || null,
    commentReplyCount: a.commentReplyCount || null,
    commentReplyText: a.commentReplyText || null,
  }));
}

export async function checkTriggerMatch(
  messageText: string,
  userId: string,
  scope: "dm" | "comment" = "dm"
): Promise<Automation | null> {
  const automation = await convex.query(api.automations.checkTriggerMatch, {
    userId: toUserId(userId),
    messageText,
    scope,
  });

  if (!automation) {
    return null;
  }

  return {
    id: automation._id,
    userId: automation.userId,
    title: automation.title,
    description: automation.description || null,
    triggerWord: automation.triggerWord,
    responseType: automation.responseType,
    responseContent: automation.responseContent,
    isActive: automation.isActive || null,
    expiresAt: automation.expiresAt ? new Date(automation.expiresAt) : null,
    createdAt: new Date(automation.createdAt),
    updatedAt: new Date(automation.updatedAt),
    triggerScope: automation.triggerScope || null,
    commentReplyCount: automation.commentReplyCount || null,
    commentReplyText: automation.commentReplyText || null,
  };
}

export async function logAutomationUsage(params: {
  userId: string;
  platform: "instagram";
  threadId: string;
  recipientId: string;
  automationId: string;
  triggerWord: string;
  action:
    | "dm_automation_triggered"
    | "comment_automation_triggered"
    | "dm_and_comment_automation_triggered";
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

  await convex.mutation(api.automations.createAutomationActionLog, {
    userId: toUserId(userId),
    platform,
    threadId,
    recipientId,
    automationId: toAutomationId(automationId),
    triggerWord,
    action,
    text,
    messageId,
    createdAt: Date.now(),
  });
}

export async function getRecentAutomationLogs(
  limit: number = 25
): Promise<AutomationLogItem[]> {
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const logs = await convex.query(api.automations.getRecentAutomationLogs, {
    userId: toUserId(user.id),
    limit: safeLimit,
  });

  const enrichedLogs = await Promise.all(
    logs.map(async (log) => {
      const contact = await convex.query(api.contacts.getContact, {
        id: toContactId(log.recipientId),
      });

      const automation = await convex.query(api.automations.getAutomation, {
        id: log.automationId,
      });

      return {
        id: log._id,
        userId: log.userId,
        platform: log.platform,
        threadId: log.threadId,
        recipientId: log.recipientId,
        recipientUsername: contact?.username || log.recipientId,
        automationId: log.automationId,
        automationTitle: automation?.title || "",
        triggerWord: log.triggerWord,
        action: log.action as
          | "dm_automation_triggered"
          | "comment_automation_triggered"
          | "dm_and_comment_automation_triggered",
        text: log.text ?? null,
        messageId: log.messageId ?? null,
        createdAt: new Date(log.createdAt),
      };
    })
  );

  return enrichedLogs;
}