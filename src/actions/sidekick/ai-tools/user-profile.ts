"use server";

import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserProfile() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const userProfile = await db.query.user.findFirst({
      where: eq(user.id, currentUser.id),
      columns: {
        id: true,
        name: true,
        email: true,
        gender: true,
        use_case: true,
        business_type: true,
        main_offering: true,
      },
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

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.gender !== undefined) updateData.gender = fields.gender;
    if (fields.use_case !== undefined) updateData.use_case = fields.use_case;
    if (fields.business_type !== undefined)
      updateData.business_type = fields.business_type;
    if (fields.main_offering !== undefined)
      updateData.main_offering = fields.main_offering;

    await db.update(user).set(updateData).where(eq(user.id, currentUser.id));

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