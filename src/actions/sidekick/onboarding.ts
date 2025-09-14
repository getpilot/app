"use server";

import { convex, api } from "@/lib/convex-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;
const toOfferId = (id: string): Id<"userOffer"> => id as Id<"userOffer">;
const toFaqId = (id: string): Id<"userFaq"> => id as Id<"userFaq">;

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
  mainOffering?: string;
  faqs?: {
    question: string;
    answer?: string;
  }[];
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
    if (data.mainOffering) {
      await convex.mutation(api.user.updateUser, {
        id: toUserId(session.user.id),
        main_offering: data.mainOffering,
        updatedAt: Date.now(),
      });
    }

    if (data.offerLinks && data.offerLinks.length > 0) {
      for (const link of data.offerLinks) {
        await convex.mutation(api.sidekick.createUserOfferLink, {
          userId: toUserId(session.user.id),
          type: link.type,
          url: link.url,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (data.offers && data.offers.length > 0) {
      for (const offer of data.offers) {
        await convex.mutation(api.sidekick.createUserOffer, {
          userId: toUserId(session.user.id),
          name: offer.name,
          content: offer.content,
          value: offer.value,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (data.faqs && data.faqs.length > 0) {
      for (const faq of data.faqs) {
        await convex.mutation(api.sidekick.createUserFaq, {
          userId: toUserId(session.user.id),
          question: faq.question,
          answer: faq.answer || undefined,
          createdAt: Date.now(),
        });
      }
    }

    if (data.toneProfile) {
      await convex.mutation(api.sidekick.createUserToneProfile, {
        userId: toUserId(session.user.id),
        toneType: data.toneProfile.toneType,
        sampleText: data.toneProfile.sampleText || [],
        sampleFiles: data.toneProfile.sampleFiles || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
    await convex.mutation(api.sidekick.deleteUserOffer, {
      id: toOfferId(offerId),
    });

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
    await convex.mutation(api.sidekick.createUserOfferLink, {
      userId: toUserId(session.user.id),
      type: linkData.type,
      url: linkData.url,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving offer link:", error);
    return { success: false, error: "Failed to save offer link" };
  }
}

export async function getSidekickFaqs() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    const faqs = await convex.query(api.sidekick.getUserFaqs, {
      userId: toUserId(session.user.id),
    });

    return { success: true, data: faqs };
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return { success: false, error: "Failed to fetch FAQs" };
  }
}

export async function deleteFaq(faqId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  try {
    await convex.mutation(api.sidekick.deleteUserFaq, {
      id: toFaqId(faqId),
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return { success: false, error: "Failed to delete FAQ" };
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
    await convex.mutation(api.sidekick.createUserOffer, {
      userId: toUserId(session.user.id),
      name: offerData.name,
      content: offerData.content,
      value: offerData.value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
    await convex.mutation(api.sidekick.createUserToneProfile, {
      userId: toUserId(session.user.id),
      toneType: toneData.toneType,
      sampleText: toneData.sampleText || [],
      sampleFiles: toneData.sampleFiles || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
    await convex.mutation(api.user.updateUser, {
      id: toUserId(session.user.id),
      sidekick_onboarding_complete: true,
      updatedAt: Date.now(),
    });

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
    const userData = await convex.query(api.user.getUser, {
      id: toUserId(session.user.id),
    });

    const links = await convex.query(api.sidekick.getUserOfferLinks, {
      userId: toUserId(session.user.id),
    });

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

    const offers = await convex.query(api.sidekick.getUserOffers, {
      userId: toUserId(session.user.id),
    });

    const toneProfile = await convex.query(api.sidekick.getUserToneProfile, {
      userId: toUserId(session.user.id),
    });

    let toneProfileData = { toneType: "", customTone: "", sampleMessages: "" };

    if (toneProfile) {
      const profile = toneProfile;
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
        mainOffering: userData?.main_offering || "",
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

export async function getSidekickMainOffering() {
  const result = await getSidekickOnboardingData();
  if (result.success) {
    return { success: true, data: result.data?.mainOffering };
  }
  return {
    success: false,
    error: result.error || "Failed to fetch main offering",
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
    const userData = await convex.query(api.user.getUser, {
      id: toUserId(session.user.id),
    });

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