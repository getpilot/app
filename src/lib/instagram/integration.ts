import { convex, api } from "@/lib/convex-client";
import { Id } from "../../../convex/_generated/dataModel";

export async function findIntegrationByIgUserId(igUserId: string) {
  return convex.query(api.instagram.getInstagramIntegrationByInstagramUserId, {
    instagramUserId: igUserId,
  });
}

export async function findLatestIntegration() {
  return convex.query(api.instagram.getLatestIntegration, {});
}

export async function findIntegrationByUserId(userId: string) {
  return convex.query(api.instagram.getInstagramIntegrationByUserId, {
    userId: userId as Id<"user">,
  });
}