"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/lib/inngest/client";
import { getUser } from "@/lib/auth-utils";

export async function getSyncSubscribeToken() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const token = await getSubscriptionToken(inngest, {
    channel: `user:${user._id}`,
    topics: ["sync"],
  });

  return token;
}