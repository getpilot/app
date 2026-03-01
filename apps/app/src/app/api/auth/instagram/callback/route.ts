import { NextResponse } from "next/server";
import { saveInstagramConnection } from "@/actions/instagram";
import {
  exchangeCodeForAccessToken,
  exchangeLongLivedInstagramToken,
  fetchInstagramProfile,
} from "@pilot/instagram";

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Instagram auth error from redirect:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${error}`);
  }

  if (!code) {
    console.error("No code provided in Instagram callback");
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`);
  }

  try {
    console.log("Exchanging code for access token...");
    const { accessToken } = await exchangeCodeForAccessToken({
      clientId: INSTAGRAM_CLIENT_ID!,
      clientSecret: INSTAGRAM_CLIENT_SECRET!,
      redirectUri: REDIRECT_URI,
      code,
    });

    console.log("Getting user profile with access token...");
    const profile = await fetchInstagramProfile({
      accessToken,
    });
    const { username, id: appScopedId, user_id: professionalUserId } = profile;
    console.log("Instagram connection successful for:", username, professionalUserId, appScopedId);

    const {
      accessToken: longLivedToken,
      expiresIn: expires_in,
    } = await exchangeLongLivedInstagramToken({
      clientSecret: INSTAGRAM_CLIENT_SECRET!,
      accessToken,
    });

    const result = await saveInstagramConnection({
      instagramUserId: professionalUserId,
      appScopedUserId: appScopedId,
      username,
      accessToken: longLivedToken,
      expiresIn: expires_in,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to save Instagram connection");
    }

    console.log("Instagram connection saved to database");
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=instagram_connected`);
  } catch (error) {
    console.error("Instagram auth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_failed`
    );
  }
}
