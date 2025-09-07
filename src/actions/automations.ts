"use server";

import { db } from "@/lib/db";
import { automation, automationLog } from "@/lib/db/schema";
import { and, eq, desc, gt, isNull, or, ne } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export type Automation = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  triggerWord: string;
  responseType: "fixed" | "ai_prompt";
  responseContent: string;
  isActive: boolean | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type CreateAutomationData = {
  title: string;
  description?: string;
  triggerWord: string;
  responseType: "fixed" | "ai_prompt";
  responseContent: string;
  expiresAt?: Date;
};

export type UpdateAutomationData = Partial<CreateAutomationData> & {
  isActive?: boolean;
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

  const newAutomation = {
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
  };

  await db.insert(automation).values(newAutomation);

  revalidatePath("/automations");
  return newAutomation;
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

  const updateData = {
    ...data,
    triggerWord: data.triggerWord?.toLowerCase(),
    updatedAt: new Date(),
  };

  await db
    .update(automation)
    .set(updateData)
    .where(and(eq(automation.id, id), eq(automation.userId, user.id)));

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
  userId: string
): Promise<Automation | null> {
  const activeAutomations = await getActiveAutomations(userId);

  for (const automation of activeAutomations) {
    if (
      messageText.toLowerCase().includes(automation.triggerWord.toLowerCase())
    ) {
      return automation;
    }
  }

  return null;
}

export async function logAutomationUsage(
  automationId: string,
  triggerWord: string,
  responseSent: boolean,
  deliveryStatus: string
): Promise<void> {
  await db.insert(automationLog).values({
    id: crypto.randomUUID(),
    automationId,
    triggerWord,
    responseSent,
    deliveryStatus,
    createdAt: new Date(),
  });
}