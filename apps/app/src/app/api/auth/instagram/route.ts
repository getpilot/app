import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildInstagramAuthUrl } from "@pilot/instagram";

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_RETURN_TO_COOKIE = "pilot_instagram_return_to";
const APP_URL =
  process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;

function normalizeReturnTo(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/settings";
  }

  try {
    // Placeholder origin used only to parse a relative in-app return path safely.
    const url = new URL(value, "http://localhost.invalid");
    if (url.origin !== "http://localhost.invalid") {
      return "/settings";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/settings";
  }
}

function getInstagramCallbackUrl(request: Request) {
  const baseUrl = APP_URL ? APP_URL.replace(/\/$/, "") : new URL(request.url).origin;
  return new URL("/api/auth/instagram/callback", baseUrl).toString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  cookieStore.set(
    INSTAGRAM_RETURN_TO_COOKIE,
    normalizeReturnTo(searchParams.get("returnTo")),
    {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );

  const redirectUri = getInstagramCallbackUrl(request);
  console.log(
    "Starting Instagram authentication flow with redirect URI:",
    redirectUri,
  );
  const authUrl = buildInstagramAuthUrl({
    clientId: INSTAGRAM_CLIENT_ID!,
    redirectUri,
  });
  console.log("Instagram authorize URL:", authUrl);

  return NextResponse.redirect(authUrl);
}
