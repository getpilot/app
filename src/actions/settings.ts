"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { cache } from "react";
import { gender_options } from "@/lib/constants/onboarding";
import { optionToValue } from "@/lib/utils";

const genderValues = gender_options.map(option => optionToValue(option));

const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  gender: z.enum([...genderValues] as [string, ...string[]]).optional(),
});

export type UpdateUserFormData = z.infer<typeof UpdateUserSchema>;

export async function updateUserSettings(formData: UpdateUserFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const validatedData = UpdateUserSchema.parse(formData);

    await db
      .update(user)
      .set({
        name: validatedData.name,
        email: validatedData.email,
        gender: validatedData.gender || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "Validation failed", 
        errors: error.issues 
      };
    }
    console.error("Error updating user settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

export async function updateProfileImage(imageUrl: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await db
      .update(user)
      .set({
        image: imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error updating profile image:", error);
    return { success: false, error: "Failed to update profile image" };
  }
}

export const getUserSettings = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return null;
  }

  try {
    const userData = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .then((res) => res[0]);

    return userData;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
});