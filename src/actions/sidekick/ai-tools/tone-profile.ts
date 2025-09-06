"use server";

import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { userToneProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getToneProfile() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const toneProfile = await db.query.userToneProfile.findFirst({
      where: eq(userToneProfile.userId, currentUser.id),
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

    const updateData: Partial<typeof userToneProfile.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (fields.toneType !== undefined) updateData.toneType = fields.toneType;
    if (fields.sampleText !== undefined)
      updateData.sampleText = fields.sampleText;
    if (fields.sampleFiles !== undefined)
      updateData.sampleFiles = fields.sampleFiles;
    if (fields.trainedEmbeddingId !== undefined)
      updateData.trainedEmbeddingId = fields.trainedEmbeddingId;

    // check if tone profile exists
    const existingProfile = await db.query.userToneProfile.findFirst({
      where: eq(userToneProfile.userId, currentUser.id),
    });

    if (existingProfile) {
      // update existing profile
      await db
        .update(userToneProfile)
        .set(updateData)
        .where(eq(userToneProfile.userId, currentUser.id));
    } else {
      // create new profile
      const profileId = crypto.randomUUID();
      const now = new Date();

      await db.insert(userToneProfile).values({
        id: profileId,
        userId: currentUser.id,
        toneType: fields.toneType || "friendly",
        sampleText: fields.sampleText || [],
        sampleFiles: fields.sampleFiles || [],
        trainedEmbeddingId: fields.trainedEmbeddingId,
        createdAt: now,
        updatedAt: now,
      });
    }

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
    const existingProfile = await db.query.userToneProfile.findFirst({
      where: eq(userToneProfile.userId, currentUser.id),
    });

    const currentSampleText = existingProfile?.sampleText || [];
    const updatedSampleText = [...currentSampleText, text];

    if (existingProfile) {
      // update existing profile
      await db
        .update(userToneProfile)
        .set({
          sampleText: updatedSampleText,
          updatedAt: new Date(),
        })
        .where(eq(userToneProfile.userId, currentUser.id));
    } else {
      // create new profile
      const profileId = crypto.randomUUID();
      const now = new Date();

      await db.insert(userToneProfile).values({
        id: profileId,
        userId: currentUser.id,
        toneType: "custom",
        sampleText: updatedSampleText,
        sampleFiles: [],
        createdAt: now,
        updatedAt: now,
      });
    }

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