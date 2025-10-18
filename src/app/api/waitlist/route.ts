"use server";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";

const WAITLIST_API_TOKEN = process.env.WAITLIST_API_TOKEN;

if (!WAITLIST_API_TOKEN) {
  console.warn("WAITLIST_API_TOKEN environment variable not set. Waitlist API will be disabled.");
}

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Please enter your name").max(100, "Name too long"),
  token: z.string().min(1, "API token required"),
});

export async function POST(request: Request) {
  try {
    if (!WAITLIST_API_TOKEN) {
      console.error("Waitlist API called but WAITLIST_API_TOKEN not configured");
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    const isInternalRequest = request.headers.get('x-internal-request') === 'true';

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validationResult = waitlistSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => err.message).join(", ");
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      );
    }

    const { email, name, token } = validationResult.data;

    if (!isInternalRequest && token !== WAITLIST_API_TOKEN) {
      console.warn("Invalid API token attempt");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const existing = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email is already on the waitlist" },
        { status: 409 }
      );
    }

    try {
      await db.insert(waitlist).values({
        id: randomUUID(),
        email,
        name: name.trim(),
      });

      console.log(`Successfully added to waitlist: ${email}`);

      return NextResponse.json({
        success: true,
        message: "Successfully added to waitlist"
      });

    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Database error adding to waitlist:", error);

      if (err && err.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Email is already on the waitlist" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to add to waitlist. Please try again." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Unexpected error in waitlist API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}