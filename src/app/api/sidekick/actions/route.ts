import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sidekickActionLog } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actions = await db.query.sidekickActionLog.findMany({
      where: eq(sidekickActionLog.userId, user.id),
      orderBy: desc(sidekickActionLog.createdAt),
      limit: 10,
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Error fetching sidekick actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch actions" },
      { status: 500 }
    );
  }
}