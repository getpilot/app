"use server";

import { getUser, getRLSDb } from "@/lib/auth-utils";
import { sidekickSetting } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";

export async function updateSystemPrompt(prompt: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getRLSDb();
    await db
      .insert(sidekickSetting)
      .values({
        userId: user.id,
        systemPrompt: prompt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sidekickSetting.userId,
        set: {
          systemPrompt: prompt,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (error) {
    console.error("Error updating system prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update prompt",
    };
  }
}

export async function getSidekickSettings() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getRLSDb();
    const settings = await db.query.sidekickSetting.findFirst({
      where: eq(sidekickSetting.userId, user.id),
    });

    return {
      success: true,
      settings: {
        systemPrompt: settings?.systemPrompt || DEFAULT_SIDEKICK_PROMPT,
      },
    };
  } catch (error) {
    console.error("Error fetching sidekick settings:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch settings",
    };
  }
}