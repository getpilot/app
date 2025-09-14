"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { Id } from "../../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;
const toOfferId = (id: string): Id<"userOffer"> => id as Id<"userOffer">;

export async function listUserOffers() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const offers = await convex.query(api.sidekick.getUserOffers, {
      userId: toUserId(currentUser.id),
    });

    return {
      success: true,
      offers: offers.map((offer) => ({
        id: offer._id,
        name: offer.name,
        content: offer.content,
        value: offer.value,
        createdAt: new Date(offer.createdAt).toISOString(),
        updatedAt: new Date(offer.updatedAt).toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching user offers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch offers",
    };
  }
}

export async function createUserOffer(
  name: string,
  content: string,
  value?: number
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const offerId = await convex.mutation(api.sidekick.createUserOffer, {
      userId: toUserId(currentUser.id),
      name,
      content,
      value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, offerId };
  } catch (error) {
    console.error("Error creating user offer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create offer",
    };
  }
}

export async function updateUserOffer(
  offerId: string,
  fields: {
    name?: string;
    content?: string;
    value?: number;
  }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    await convex.mutation(api.sidekick.updateUserOffer, {
      id: toOfferId(offerId),
      name: fields.name,
      content: fields.content,
      value: fields.value,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user offer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update offer",
    };
  }
}

export async function deleteUserOffer(offerId: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    await convex.mutation(api.sidekick.deleteUserOffer, {
      id: toOfferId(offerId),
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting user offer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete offer",
    };
  }
}

export async function listUserOfferLinks() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const links = await convex.query(api.sidekick.getUserOfferLinks, {
      userId: toUserId(currentUser.id),
    });

    return {
      success: true,
      links: links.map((link) => ({
        id: link._id,
        type: link.type,
        url: link.url,
        createdAt: new Date(link.createdAt).toISOString(),
        updatedAt: new Date(link.updatedAt).toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching user offer links:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch offer links",
    };
  }
}

export async function addUserOfferLink(
  type: "primary" | "calendar" | "notion" | "website",
  url: string
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const linkId = await convex.mutation(api.sidekick.createUserOfferLink, {
      userId: toUserId(currentUser.id),
      type,
      url,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, linkId };
  } catch (error) {
    console.error("Error adding user offer link:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add offer link",
    };
  }
}