'use server';

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { polarInstance } from "@/lib/polar/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.redirect("/sign-in");
  }

  try {
    const result = await polarInstance.customerSessions.create({
      externalCustomerId: session.user.id,
    });
    return NextResponse.redirect(new URL(result.customerPortalUrl));
  } catch (error) {
    console.error("Failed to create Polar customer portal session:", error);
    return NextResponse.redirect(new URL("/upgrade", request.url));
  }
}