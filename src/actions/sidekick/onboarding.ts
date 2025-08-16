"use server";

import { v4 as uuidv4 } from "uuid";
import {
  userOffer,
  userToneProfile,
  userOfferLink,
  user,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function saveSidekickOfferLink(linkData: {
  type: "primary" | "calendar" | "notion" | "website";
  url: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    await db.insert(userOfferLink).values({
      id: uuidv4(),
      userId: session.user.id,
      type: linkData.type,
      url: linkData.url,
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving offer link:", error);
    return { success: false, error: "Failed to save offer link" };
  }
}

export async function saveSidekickOffer(offerData: {
  name: string;
  content: string;
  value?: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    await db.insert(userOffer).values({
      id: uuidv4(),
      userId: session.user.id,
      name: offerData.name,
      content: offerData.content,
      value: offerData.value,
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving offer:", error);
    return { success: false, error: "Failed to save offer" };
  }
}

export async function saveSidekickToneProfile(toneData: {
  toneType: "friendly" | "direct" | "like_me" | "custom";
  sampleText?: string[];
  sampleFiles?: string[];
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    await db.insert(userToneProfile).values({
      id: uuidv4(),
      userId: session.user.id,
      toneType: toneData.toneType,
      sampleText: toneData.sampleText || [],
      sampleFiles: toneData.sampleFiles || [],
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving tone profile:", error);
    return { success: false, error: "Failed to save tone profile" };
  }
}

export async function completeSidekickOnboarding() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    await db
      .update(user)
      .set({
        sidekick_onboarding_complete: true,
      })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error completing sidekick onboarding:", error);
    return { success: false, error: "Failed to complete sidekick onboarding" };
  }
}