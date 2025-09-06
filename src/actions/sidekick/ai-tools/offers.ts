"use server";

import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { userOffer, userOfferLink } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function listUserOffers() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const offers = await db.query.userOffer.findMany({
      where: eq(userOffer.userId, currentUser.id),
      orderBy: (offers, { desc }) => [desc(offers.createdAt)],
    });

    return {
      success: true,
      offers: offers.map((offer) => ({
        id: offer.id,
        name: offer.name,
        content: offer.content,
        value: offer.value,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
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

    const offerId = crypto.randomUUID();
    const now = new Date();

    await db.insert(userOffer).values({
      id: offerId,
      userId: currentUser.id,
      name,
      content,
      value,
      createdAt: now,
      updatedAt: now,
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

    const updateData: Partial<typeof userOffer.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.content !== undefined) updateData.content = fields.content;
    if (fields.value !== undefined) updateData.value = fields.value;

    await db
      .update(userOffer)
      .set(updateData)
      .where(
        and(eq(userOffer.id, offerId), eq(userOffer.userId, currentUser.id))
      );

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

    await db
      .delete(userOffer)
      .where(
        and(eq(userOffer.id, offerId), eq(userOffer.userId, currentUser.id))
      );

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

    const links = await db.query.userOfferLink.findMany({
      where: eq(userOfferLink.userId, currentUser.id),
      orderBy: (links, { desc }) => [desc(links.createdAt)],
    });

    return {
      success: true,
      links: links.map((link) => ({
        id: link.id,
        type: link.type,
        url: link.url,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
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

    const linkId = crypto.randomUUID();
    const now = new Date();

    await db.insert(userOfferLink).values({
      id: linkId,
      userId: currentUser.id,
      type,
      url,
      createdAt: now,
      updatedAt: now,
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