"use server";

import {
  userOffer,
  userToneProfile,
  userOfferLink,
  userFaq,
  user,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getRLSDb } from "@/lib/auth-utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

async function fetchPersonalizedSidekickData(userId: string) {
  try {
    const db = await getRLSDb();
    const userData = await db
      .select({
        name: user.name,
        main_offering: user.main_offering,
        use_case: user.use_case,
        business_type: user.business_type,
        leads_per_month: user.leads_per_month,
        active_platforms: user.active_platforms,
        pilot_goal: user.pilot_goal,
        current_tracking: user.current_tracking,
      })
      .from(user)
      .where(eq(user.id, userId))
      .then((res) => res[0]);

    const links = await db
      .select()
      .from(userOfferLink)
      .where(eq(userOfferLink.userId, userId));

    const offers = await db
      .select()
      .from(userOffer)
      .where(eq(userOffer.userId, userId));

    const toneProfiles = await db
      .select()
      .from(userToneProfile)
      .where(eq(userToneProfile.userId, userId))
      .limit(1);

    const faqs = await db
      .select()
      .from(userFaq)
      .where(eq(userFaq.userId, userId));

    if (!userData) {
      return { success: false, error: "User not found" } as const;
    }

    return {
      success: true,
      data: {
        user: userData,
        offerLinks: links,
        offers,
        toneProfile: toneProfiles[0] || null,
        faqs,
      },
    } as const;
  } catch (error) {
    console.error("Error fetching personalized sidekick data:", error);
    return {
      success: false,
      error: "Failed to fetch personalized sidekick data",
    } as const;
  }
}

export async function getPersonalizedSidekickData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  return fetchPersonalizedSidekickData(session.user.id);
}

export async function getPersonalizedSidekickDataByUserId(userId: string) {
  return fetchPersonalizedSidekickData(userId);
}