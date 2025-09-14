"use server";

import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { polarInstance } from "@/lib/polar/server";

export async function GET(request: Request) {
  const user = await getUser();

  if (!user) {
    return NextResponse.redirect("/sign-in");
  }

  try {
    const result = await polarInstance.customerSessions.create({
      externalCustomerId: user._id,
    });
    return NextResponse.redirect(new URL(result.customerPortalUrl));
  } catch (error) {
    console.error("Failed to create Polar customer portal session:", error);
    return NextResponse.redirect(new URL("/upgrade", request.url));
  }
}