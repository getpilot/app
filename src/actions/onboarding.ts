"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { redirect } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

export async function getUserData() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  try {
    const userData = await convex.query(api.user.getUser, {
      id: toUserId(user._id),
    });

    return { success: true, userData };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return { success: false, error: "Failed to fetch user data" };
  }
}

export async function updateOnboardingStep(
  formData: Record<string, string | string[]>
) {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  try {
    await convex.mutation(api.user.updateUser, {
      id: toUserId(user._id),
      ...formData,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating onboarding data:", error);
    return { success: false, error: "Failed to update onboarding data" };
  }
}

export async function completeOnboarding() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  try {
    await convex.mutation(api.user.updateUser, {
      id: toUserId(user._id),
      onboarding_complete: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "Failed to complete onboarding" };
  }
}

export async function checkOnboardingStatus() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  try {
    const userData = await convex.query(api.user.getUser, {
      id: toUserId(user._id),
    });

    return { onboarding_complete: userData?.onboarding_complete || false };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return {
      onboarding_complete: false,
      error: "Failed to check onboarding status",
    };
  }
}