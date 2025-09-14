"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";
import { Id } from "../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

export async function updateSystemPrompt(prompt: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    await convex.mutation(api.sidekick.upsertSidekickSetting, {
      userId: toUserId(user._id),
      systemPrompt: prompt,
      updatedAt: Date.now(),
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

    const settings = await convex.query(api.sidekick.getSidekickSetting, {
      userId: toUserId(user._id),
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