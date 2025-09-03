import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sidekickActionLog, contact } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({
        id: sidekickActionLog.id,
        userId: sidekickActionLog.userId,
        platform: sidekickActionLog.platform,
        threadId: sidekickActionLog.threadId,
        recipientId: sidekickActionLog.recipientId,
        action: sidekickActionLog.action,
        text: sidekickActionLog.text,
        result: sidekickActionLog.result,
        createdAt: sidekickActionLog.createdAt,
        messageId: sidekickActionLog.messageId,
        recipientUsername: contact.username,
      })
      .from(sidekickActionLog)
      .leftJoin(
        contact,
        and(
          eq(contact.id, sidekickActionLog.recipientId),
          eq(contact.userId, sidekickActionLog.userId)
        )
      )
      .where(eq(sidekickActionLog.userId, user.id))
      .orderBy(desc(sidekickActionLog.createdAt))
      .limit(10);

    const actions = rows.map((r) => ({
      ...r,
      recipientUsername: r.recipientUsername || r.recipientId,
    }));

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Error fetching sidekick actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch actions" },
      { status: 500 }
    );
  }
}