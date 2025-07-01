"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function updateOnboardingStep(formData: Record<string, string | string[]>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    await db.update(user).set(formData).where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error updating onboarding data:", error);
    return { success: false, error: "Failed to update onboarding data" };
  }
}

export async function completeOnboarding() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    await db
      .update(user)
      .set({ onboarding_complete: true })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "Failed to complete onboarding" };
  }
}

export async function checkOnboardingStatus() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    const userData = await db
      .select({ onboarding_complete: user.onboarding_complete })
      .from(user)
      .where(eq(user.id, session.user.id))
      .then((res) => res[0]);

    return { onboarding_complete: userData?.onboarding_complete || false };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return { onboarding_complete: false, error: "Failed to check onboarding status" };
  }
}