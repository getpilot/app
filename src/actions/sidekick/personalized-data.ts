"use server";

import { convex, api } from "@/lib/convex-client";
import { getUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

async function fetchPersonalizedSidekickData(userId: string) {
  try {
    const userData = await convex.query(api.user.getUser, {
      id: toUserId(userId),
    });

    const links = await convex.query(api.sidekick.getUserOfferLinks, {
      userId: toUserId(userId),
    });

    const offers = await convex.query(api.sidekick.getUserOffers, {
      userId: toUserId(userId),
    });

    const toneProfile = await convex.query(api.sidekick.getUserToneProfile, {
      userId: toUserId(userId),
    });

    const faqs = await convex.query(api.sidekick.getUserFaqs, {
      userId: toUserId(userId),
    });

    if (!userData) {
      return { success: false, error: "User not found" } as const;
    }

    return {
      success: true,
      data: {
        user: {
          name: userData.name,
          main_offering: userData.main_offering,
          use_case: userData.use_case,
          business_type: userData.business_type,
          leads_per_month: userData.leads_per_month,
          active_platforms: userData.active_platforms,
          pilot_goal: userData.pilot_goal,
          current_tracking: userData.current_tracking,
        },
        offerLinks: links,
        offers,
        toneProfile: toneProfile || null,
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
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return fetchPersonalizedSidekickData(user._id);
}

export async function getPersonalizedSidekickDataByUserId(userId: string) {
  return fetchPersonalizedSidekickData(userId);
}