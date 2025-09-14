"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { Id } from "../../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

export async function getToneProfile() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const toneProfile = await convex.query(api.sidekick.getUserToneProfile, {
      userId: toUserId(currentUser.id),
    });

    return {
      success: true,
      toneProfile: toneProfile
        ? {
            toneType: toneProfile.toneType,
            sampleText: toneProfile.sampleText || [],
            sampleFiles: toneProfile.sampleFiles || [],
            trainedEmbeddingId: toneProfile.trainedEmbeddingId,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching tone profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch tone profile",
    };
  }
}

export async function updateToneProfile(fields: {
  toneType?: "friendly" | "direct" | "like_me" | "custom";
  sampleText?: string[];
  sampleFiles?: string[];
  trainedEmbeddingId?: string;
}) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    await convex.mutation(api.sidekick.upsertUserToneProfile, {
      userId: toUserId(currentUser.id),
      toneType: fields.toneType,
      sampleText: fields.sampleText,
      sampleFiles: fields.sampleFiles,
      trainedEmbeddingId: fields.trainedEmbeddingId,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating tone profile:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update tone profile",
    };
  }
}

export async function addToneSample(text: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // get existing tone profile
    const existingProfile = await convex.query(
      api.sidekick.getUserToneProfile,
      {
        userId: toUserId(currentUser.id),
      }
    );

    const currentSampleText = existingProfile?.sampleText || [];
    const updatedSampleText = [...currentSampleText, text];

    await convex.mutation(api.sidekick.upsertUserToneProfile, {
      userId: toUserId(currentUser.id),
      toneType: existingProfile?.toneType || "custom",
      sampleText: updatedSampleText,
      sampleFiles: existingProfile?.sampleFiles || [],
      trainedEmbeddingId: existingProfile?.trainedEmbeddingId,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding tone sample:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add tone sample",
    };
  }
}