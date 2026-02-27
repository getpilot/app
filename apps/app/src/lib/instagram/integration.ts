import { db } from "@pilot/db";
import { instagramIntegration } from "@pilot/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function findIntegrationByIgUserId(igUserId: string) {
  return db.query.instagramIntegration.findFirst({
    where: and(eq(instagramIntegration.instagramUserId, igUserId)),
  });
}

export async function findLatestIntegration() {
  const rows = await db
    .select()
    .from(instagramIntegration)
    .orderBy(desc(instagramIntegration.updatedAt))
    .limit(1);
  return rows[0] || null;
}

export async function findIntegrationByUserId(userId: string) {
  return db.query.instagramIntegration.findFirst({
    where: eq(instagramIntegration.userId, userId),
  });
}
