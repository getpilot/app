"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { z } from "zod";
import { cache } from "react";
import { gender_options } from "@/lib/constants/onboarding";
import { optionToValue } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

const genderValues = gender_options.map((option) => optionToValue(option));

const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  gender: z.enum([...genderValues] as [string, ...string[]]).optional(),
});

export type UpdateUserFormData = z.infer<typeof UpdateUserSchema>;

export async function updateUserSettings(formData: UpdateUserFormData) {
  const user = await getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const validatedData = UpdateUserSchema.parse(formData);

    await convex.mutation(api.user.updateUser, {
      id: toUserId(user._id),
      name: validatedData.name,
      email: validatedData.email,
      gender: validatedData.gender || undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        errors: error.issues,
      };
    }
    console.error("Error updating user settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

export async function updateProfileImage(imageUrl: string) {
  const user = await getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await convex.mutation(api.user.updateUser, {
      id: toUserId(user._id),
      image: imageUrl,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile image:", error);
    return { success: false, error: "Failed to update profile image" };
  }
}

export const getUserSettings = cache(async () => {
  const user = await getUser();

  if (!user) {
    return null;
  }

  try {
    const userData = await convex.query(api.user.getUser, {
      id: toUserId(user._id),
    });

    if (!userData) {
      return null;
    }

    return {
      id: userData._id,
      name: userData.name,
      email: userData.email,
      gender: userData.gender,
      image: userData.image,
    };
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
});