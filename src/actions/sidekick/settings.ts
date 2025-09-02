"use server";

import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sidekickSetting } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateSystemPrompt(prompt: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

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

    const settings = await db.query.sidekickSetting.findFirst({
      where: eq(sidekickSetting.userId, user.id),
    });

    return {
      success: true,
      settings: {
        systemPrompt:
          settings?.systemPrompt ||
          "You are a friendly, professional assistant focused on qualifying leads and helping with business inquiries.",
        confidenceThreshold: settings?.confidenceThreshold || 0.8,
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