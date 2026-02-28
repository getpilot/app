import { NextResponse } from "next/server";
import { buildInstagramAuthUrl } from "@pilot/instagram";

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

export async function GET() {
  console.log("Starting Instagram authentication flow with redirect URI:", REDIRECT_URI);
  const authUrl = buildInstagramAuthUrl({
    clientId: INSTAGRAM_CLIENT_ID!,
    redirectUri: REDIRECT_URI,
  });

  return NextResponse.redirect(authUrl);
}
