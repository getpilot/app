"use server";

import { convex, api } from "@/lib/convex-client";
import { getUser } from "@/lib/auth-utils";
import axios from "axios";
import { z } from "zod";
import { Id } from "../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;

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

  const integration = await convex.query(
    api.instagram.getInstagramIntegrationByUserId,
    {
      userId: toUserId(user.id),
    }
  );

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
    const integration = await convex.query(
      api.instagram.getInstagramIntegrationByUserId,
      {
        userId: toUserId(user.id),
      }
    );

    if (integration) {
      await convex.mutation(api.instagram.deleteInstagramIntegration, {
        id: integration._id,
      });
    }

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
  const { instagramUserId, appScopedUserId, username, accessToken, expiresIn } =
    parsed.data;

  const user = await getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    const existingIntegration = await convex.query(
      api.instagram.getInstagramIntegrationByUserId,
      {
        userId: toUserId(user.id),
      }
    );

    const expiresAt = Date.now() + expiresIn * 1000;

    if (existingIntegration) {
      await convex.mutation(api.instagram.updateInstagramIntegration, {
        id: existingIntegration._id,
        instagramUserId,
        appScopedUserId,
        username,
        accessToken,
        expiresAt,
        updatedAt: Date.now(),
      });
    } else {
      await convex.mutation(api.instagram.createInstagramIntegration, {
        userId: toUserId(user.id),
        instagramUserId,
        appScopedUserId,
        username,
        accessToken,
        expiresAt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
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

  const integ = await convex.query(
    api.instagram.getInstagramIntegrationByUserId,
    {
      userId: toUserId(user.id),
    }
  );

  if (!integ) return { connected: false };

  const hours = Math.min(24, Math.max(5, integ.syncIntervalHours ?? 24));
  return {
    connected: true,
    intervalHours: hours,
    lastSyncedAt: integ.lastSyncedAt
      ? new Date(integ.lastSyncedAt).toISOString()
      : null,
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
    const existingIntegration = await convex.query(
      api.instagram.getInstagramIntegrationByUserId,
      {
        userId: toUserId(user.id),
      }
    );
    if (!existingIntegration) {
      return { success: false, error: "instagram not connected" };
    }

    await convex.mutation(api.instagram.updateSyncInterval, {
      id: existingIntegration._id,
      syncIntervalHours: clamped,
      updatedAt: Date.now(),
    });

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
  const integration = await convex.query(
    api.instagram.getInstagramIntegrationByUserId,
    {
      userId: toUserId(user.id),
    }
  );
  if (!integration) {
    throw new Error("Instagram not connected");
  }

  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${Math.max(
    1,
    Math.min(25, limit)
  )}&access_token=${encodeURIComponent(integration.accessToken)}`;

  const res = await axios.get(url, {
    validateStatus: () => true,
    timeout: 10000,
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to fetch posts (${res.status})`);
  }
  const items = Array.isArray(res.data?.data) ? res.data.data : [];
  return items as Array<{
    id: string;
    caption?: string;
    media_type?: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink?: string;
    timestamp?: string;
  }>;
}