"use server";

import { db } from "@/lib/db";
import { instagramIntegration } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { z } from "zod";

const InstagramConnectionSchema = z.object({
  instagramUserId: z.string(),
  appScopedUserId: z.string(),
  username: z.string(),
  accessToken: z.string(),
  expiresIn: z.number(),
});

export async function getInstagramIntegration() {
  const user = await getUser();

  if (!user) {
    return { connected: false };
  }

  const integration = await db.query.instagramIntegration.findFirst({
    where: eq(instagramIntegration.userId, user.id),
  });

  if (!integration) {
    return { connected: false };
  }

  try {
    await axios.get(
      `https://graph.instagram.com/me?fields=id,username&access_token=${integration.accessToken}`
    );

    return {
      connected: true,
      username: integration.username,
      id: integration.instagramUserId,
    };
  } catch (error) {
    console.error("Instagram API validation error:", error);
    return { connected: false, error: "Invalid token" };
  }
}

export async function disconnectInstagram() {
  const user = await getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    await db
      .delete(instagramIntegration)
      .where(eq(instagramIntegration.userId, user.id));
    return { success: true };
  } catch (error) {
    console.error("Failed to disconnect Instagram:", error);
    return { success: false, error: "Failed to disconnect" };
  }
}

export async function saveInstagramConnection(data: unknown) {
  const parsed = InstagramConnectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }
  const { instagramUserId, appScopedUserId, username, accessToken, expiresIn } = parsed.data;

  const user = await getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    const existingIntegration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, user.id),
    });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    if (existingIntegration) {
      await db
        .update(instagramIntegration)
        .set({
          instagramUserId,
          appScopedUserId,
          username,
          accessToken,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(instagramIntegration.id, existingIntegration.id));
    } else {
      await db.insert(instagramIntegration).values({
        id: uuidv4(),
        userId: user.id,
        instagramUserId,
        appScopedUserId,
        username,
        accessToken,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to save Instagram connection:", error);
    return { success: false, error: "Failed to save connection" };
  }
}

export async function getInstagramSyncConfig() {
  const user = await getUser();
  if (!user) return { connected: false };

  const integ = await db.query.instagramIntegration.findFirst({
    where: eq(instagramIntegration.userId, user.id),
  });

  if (!integ) return { connected: false };

  const hours = Math.min(24, Math.max(5, integ.syncIntervalHours ?? 24));
  return {
    connected: true,
    intervalHours: hours,
    lastSyncedAt: integ.lastSyncedAt ? integ.lastSyncedAt.toISOString() : null,
  };
}

export async function updateInstagramSyncInterval(hours: number) {
  const user = await getUser();
  if (!user) return { success: false, error: "not authenticated" };

  // coerce and validate to ensure NaN never reaches the database
  const coerced = Number(hours);
  if (!Number.isFinite(coerced) || Number.isNaN(coerced)) {
    return { success: false, error: "invalid intervalHours" };
  }

  const floored = Math.floor(coerced);
  const clamped = Math.min(24, Math.max(5, floored));

  try {
    const existingIntegration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, user.id),
    });
    if (!existingIntegration) {
      return { success: false, error: "instagram not connected" };
    }

    await db
      .update(instagramIntegration)
      .set({ syncIntervalHours: clamped, updatedAt: new Date() })
      .where(eq(instagramIntegration.id, existingIntegration.id));

    return { success: true, intervalHours: clamped };
  } catch (error) {
    console.error("failed to update sync interval:", error);
    return { success: false, error: "update failed" };
  }
}

export async function getRecentInstagramPosts(limit: number = 5) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const integration = await db.query.instagramIntegration.findFirst({
    where: eq(instagramIntegration.userId, user.id),
  });
  if (!integration) {
    throw new Error("Instagram not connected");
  }

  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${Math.max(
    1,
    Math.min(25, limit)
  )}&access_token=${encodeURIComponent(integration.accessToken)}`;

  const res = await axios.get(url, { validateStatus: () => true, timeout: 10000 });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to fetch posts (${res.status})`);
  }
  const items = Array.isArray(res.data?.data) ? res.data.data : [];
  return items as Array<{
    id: string;
    caption?: string;
    media_type?: string;
    media_url?: string;
    permalink?: string;
    timestamp?: string;
  }>;
}