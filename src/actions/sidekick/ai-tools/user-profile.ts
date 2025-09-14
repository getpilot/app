"use server";

import { z } from "zod";
import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { Id } from "../../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

const updateUserProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  gender: z.string().trim().max(50, "Gender too long").optional(),
  use_case: z
    .array(z.string().trim().min(1, "Use case cannot be empty"))
    .max(10, "Too many use cases")
    .optional(),
  business_type: z
    .string()
    .trim()
    .max(100, "Business type too long")
    .optional(),
  main_offering: z
    .string()
    .trim()
    .max(500, "Main offering too long")
    .optional(),
});

export async function getUserProfile() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const userProfile = await convex.query(api.user.getUser, {
      id: toUserId(currentUser._id),
    });

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    return {
      success: true,
      profile: {
        name: userProfile.name,
        email: userProfile.email,
        gender: userProfile.gender,
        use_case: userProfile.use_case,
        business_type: userProfile.business_type,
        main_offering: userProfile.main_offering,
      },
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch user profile",
    };
  }
}

export async function updateUserProfile(fields: {
  name?: string;
  gender?: string;
  use_case?: string[];
  business_type?: string;
  main_offering?: string;
}) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validationResult = updateUserProfileSchema.safeParse(fields);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Validation failed: ${validationResult.error.issues
          .map((e) => e.message)
          .join(", ")}`,
      };
    }

    const validatedFields = validationResult.data;

    await convex.mutation(api.user.updateUser, {
      id: toUserId(currentUser._id),
      name: validatedFields.name,
      gender: validatedFields.gender,
      use_case: validatedFields.use_case,
      business_type: validatedFields.business_type,
      main_offering: validatedFields.main_offering,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update user profile",
    };
  }
}