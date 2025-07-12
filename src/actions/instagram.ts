'use server'

import { db } from "@/lib/db";
import { instagramIntegration } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export async function getInstagramIntegration() {
  const user = await getUser();
  
  if (!user) {
    return { connected: false };
  }
  
  const integration = await db.query.instagramIntegration.findFirst({
    where: eq(instagramIntegration.userId, user.id)
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
      id: integration.instagramUserId
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
    await db.delete(instagramIntegration).where(eq(instagramIntegration.userId, user.id));
    return { success: true };
  } catch (error) {
    console.error("Failed to disconnect Instagram:", error);
    return { success: false, error: "Failed to disconnect" };
  }
}

export async function saveInstagramConnection(data: {
  instagramUserId: string;
  username: string;
  accessToken: string;
  expiresIn: number;
}) {
  const user = await getUser();
  
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }
  
  try {
    const existingIntegration = await db.query.instagramIntegration.findFirst({
      where: eq(instagramIntegration.userId, user.id)
    });
    
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expiresIn);
    
    if (existingIntegration) {
      await db.update(instagramIntegration)
        .set({
          instagramUserId: data.instagramUserId,
          username: data.username,
          accessToken: data.accessToken,
          expiresAt,
          updatedAt: new Date()
        })
        .where(eq(instagramIntegration.id, existingIntegration.id));
    } else {
      await db.insert(instagramIntegration).values({
        id: uuidv4(),
        userId: user.id,
        instagramUserId: data.instagramUserId,
        username: data.username,
        accessToken: data.accessToken,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to save Instagram connection:", error);
    return { success: false, error: "Failed to save connection" };
  }
}