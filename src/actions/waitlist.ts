"use server";

import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function addToWaitlist(email: string, name: string) {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email" };
    }

    if (!name.trim()) {
      return { success: false, error: "Please enter your name" };
    }

    const existing = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Email is already on the waitlist" };
    }

    try {
      await db.insert(waitlist).values({
        id: randomUUID(),
        email,
        name: name.trim(),
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err && err.code === "23505") {
        return { success: false, error: "Email is already on the waitlist" };
      }
      throw e;
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return { success: false, error: "Failed to add to waitlist" };
  }
}