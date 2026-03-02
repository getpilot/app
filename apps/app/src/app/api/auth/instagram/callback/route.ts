import { NextResponse } from "next/server";
import { saveInstagramConnection } from "@/actions/instagram";
import axios from "axios";

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;

export async function GET(request: Request) {
  const redirectUri = new URL("/api/auth/instagram/callback", request.url).toString();
  const { searchParams } = new URL(request.url);
  const code = getRawQueryParam(request.url, "code");
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
    console.log("Exchanging code for access token with redirect URI:", redirectUri);
    const tokenResponse = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: INSTAGRAM_CLIENT_ID!,
        client_secret: INSTAGRAM_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const { access_token } = tokenResponse.data as { access_token: string };

    console.log("Getting user profile with access token...");
    const profileResponse = await axios.get(
      `https://graph.instagram.com/me?fields=id,username,user_id&access_token=${access_token}`,
    );
    const {
      username,
      id: appScopedId,
      user_id: professionalUserId,
    } = profileResponse.data as {
      username: string;
      id: string;
      user_id: string;
    };
    console.log("Instagram connection successful for:", username, professionalUserId, appScopedId);

    const longLivedTokenResponse = await axios.get(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${access_token}`,
    );
    const {
      access_token: longLivedToken,
      expires_in,
    } = longLivedTokenResponse.data as {
      access_token: string;
      expires_in: number;
    };

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
    if (axios.isAxiosError(error)) {
      console.error("Instagram auth axios error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("Instagram auth error:", error);
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_failed`
    );
  }
}

function getRawQueryParam(url: string, key: string): string | null {
  const queryStart = url.indexOf("?");
  if (queryStart === -1) {
    return null;
  }

  const query = url.slice(queryStart + 1).split("#", 1)[0];
  for (const pair of query.split("&")) {
    if (!pair) {
      continue;
    }

    const [rawKey, ...rawValueParts] = pair.split("=");
    if (decodeURIComponent(rawKey) !== key) {
      continue;
    }

    return decodeURIComponent(rawValueParts.join("="));
  }

  return null;
}
