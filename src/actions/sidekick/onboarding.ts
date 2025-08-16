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
import { and, eq } from "drizzle-orm";

export type SidekickOnboardingData = {
  offerLinks?: {
    type: "primary" | "calendar" | "notion" | "website";
    url: string;
  }[];
  offers?: {
    name: string;
    content: string;
    value?: number;
  }[];
  productDescription?: string;
  toneProfile?: {
    toneType: "friendly" | "direct" | "like_me" | "custom";
    sampleText?: string[];
    sampleFiles?: string[];
  };
};

export async function updateSidekickOnboardingData(
  data: SidekickOnboardingData
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    if (data.offerLinks && data.offerLinks.length > 0) {
      for (const link of data.offerLinks) {
        await db.insert(userOfferLink).values({
          id: uuidv4(),
          userId: session.user.id,
          type: link.type,
          url: link.url,
        });
      }
    }

    if (data.offers && data.offers.length > 0) {
      for (const offer of data.offers) {
        await db.insert(userOffer).values({
          id: uuidv4(),
          userId: session.user.id,
          name: offer.name,
          content: offer.content,
          value: offer.value,
        });
      }
    }

    if (data.toneProfile) {
      await db.insert(userToneProfile).values({
        id: uuidv4(),
        userId: session.user.id,
        toneType: data.toneProfile.toneType,
        sampleText: data.toneProfile.sampleText || [],
        sampleFiles: data.toneProfile.sampleFiles || [],
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating sidekick onboarding data:", error);
    return {
      success: false,
      error: "Failed to update sidekick onboarding data",
    };
  }
}

export async function deleteOffer(offerId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    await db
      .delete(userOffer)
      .where(
        and(eq(userOffer.id, offerId), eq(userOffer.userId, session.user.id))
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting offer:", error);
    return { success: false, error: "Failed to delete offer" };
  }
}

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

export async function getSidekickOnboardingData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const links = await db
      .select()
      .from(userOfferLink)
      .where(eq(userOfferLink.userId, session.user.id));

    const formattedLinks = {
      primaryOfferUrl: "",
      calendarLink: "",
      additionalInfoUrl: "",
    };

    links.forEach((link) => {
      if (link.type === "primary") {
        formattedLinks.primaryOfferUrl = link.url;
      } else if (link.type === "calendar") {
        formattedLinks.calendarLink = link.url;
      } else if (link.type === "website") {
        formattedLinks.additionalInfoUrl = link.url;
      }
    });

    const offers = await db
      .select()
      .from(userOffer)
      .where(eq(userOffer.userId, session.user.id));

    const toneProfiles = await db
      .select()
      .from(userToneProfile)
      .where(eq(userToneProfile.userId, session.user.id))
      .limit(1);

    let toneProfileData = { toneType: "", customTone: "", sampleMessages: "" };

    if (toneProfiles.length > 0) {
      const profile = toneProfiles[0];
      let toneType = "";
      let customTone = "";
      let sampleMessages = "";

      switch (profile.toneType) {
        case "friendly":
          toneType = "Chill & Friendly";
          break;
        case "direct":
          toneType = "Confident & Direct";
          break;
        case "like_me":
          toneType = "Like Me";
          if (profile.sampleText && profile.sampleText.length > 0) {
            sampleMessages = profile.sampleText.join("\n");
          }
          break;
        case "custom":
          toneType = "Custom";
          if (profile.sampleText && profile.sampleText.length > 0) {
            customTone = profile.sampleText[0];
          }
          break;
      }

      toneProfileData = {
        toneType,
        customTone,
        sampleMessages,
      };
    }

    return {
      success: true,
      data: {
        offerLinks: formattedLinks,
        offers,
        toneProfile: toneProfileData,
      },
    };
  } catch (error) {
    console.error("Error fetching sidekick onboarding data:", error);
    return {
      success: false,
      error: "Failed to fetch sidekick onboarding data",
    };
  }
}

export async function getSidekickOfferLinks() {
  const result = await getSidekickOnboardingData();
  if (result.success) {
    return { success: true, data: result.data?.offerLinks };
  }
  return {
    success: false,
    error: result.error || "Failed to fetch offer links",
  };
}

export async function getSidekickOffers() {
  const result = await getSidekickOnboardingData();
  if (result.success) {
    return { success: true, data: result.data?.offers };
  }
  return { success: false, error: result.error || "Failed to fetch offers" };
}

export async function getSidekickToneProfile() {
  const result = await getSidekickOnboardingData();
  if (result.success) {
    return { success: true, data: result.data?.toneProfile };
  }
  return {
    success: false,
    error: result.error || "Failed to fetch tone profile",
  };
}

export async function checkSidekickOnboardingStatus() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    const userData = await db
      .select({
        sidekick_onboarding_complete: user.sidekick_onboarding_complete,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .then((res) => res[0]);

    return {
      sidekick_onboarding_complete:
        userData?.sidekick_onboarding_complete || false,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return {
      sidekick_onboarding_complete: false,
      error: "Failed to check onboarding status",
    };
  }
}