import { NextResponse } from "next/server";
import { buildInstagramAuthUrl } from "@pilot/instagram";

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;

export async function GET(request: Request) {
  const redirectUri = new URL("/api/auth/instagram/callback", request.url).toString();
  console.log("Starting Instagram authentication flow with redirect URI:", redirectUri);
  const authUrl = buildInstagramAuthUrl({
    clientId: INSTAGRAM_CLIENT_ID!,
    redirectUri,
  });

  return NextResponse.redirect(authUrl);
}
