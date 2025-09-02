import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { instagramIntegration } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";

// minimal instagram webhook for testing:
// - verifies with hub.challenge
// - on dm message event, replies with static "hello." using the saved long-lived access token

export async function GET(request: Request) {
  try {
    console.log("GET request received", { url: request.url });
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("GET params", { mode, token, challenge });

    const expected = process.env.IG_WEBHOOK_VERIFY_TOKEN;
    console.log("Expected verify token", { expected });

    if (mode === "subscribe" && challenge) {
      if (!expected || !token || expected === token) {
        console.log("Verification successful, returning challenge", {
          challenge,
        });
        return new NextResponse(challenge, { status: 200 });
      }
      console.log("Verification failed, forbidden");
      return new NextResponse("forbidden", { status: 403 });
    }

    console.log("GET fallback, returning ok");
    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    console.error("GET error", err);
    return new NextResponse("error", { status: 500 });
  }
}

type InstagramWebhookPayload = {
  object: string;
  entry: Array<{
    id: string;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp?: number;
      message?: { text?: string; mid?: string };
    }>;
    changes?: Array<unknown>;
  }>;
};

export async function POST(request: Request) {
  try {
    console.log("POST request received");
    const body = (await request.json()) as InstagramWebhookPayload;
    console.log("POST body", body);

    const entry = body?.entry?.[0];
    console.log("Entry", entry);
    const igUserId = entry?.id;
    const msg = entry?.messaging?.[0];
    console.log("Message", msg);
    const senderId = msg?.sender?.id;
    const hasMessage = Boolean(msg?.message?.text);

    console.log("igUserId", igUserId);
    console.log("senderId", senderId);
    console.log("hasMessage", hasMessage);

    if (igUserId && senderId && hasMessage) {
      console.log("Looking up integration for igUserId", igUserId);
      let integration = await db.query.instagramIntegration.findFirst({
        where: and(eq(instagramIntegration.instagramUserId, igUserId)),
      });
      console.log("Integration found by igUserId?", Boolean(integration));

      if (!integration) {
        console.warn(
          "No direct match for igUserId. Falling back to most recent integration."
        );
        const rows = await db
          .select()
          .from(instagramIntegration)
          .orderBy(desc(instagramIntegration.updatedAt))
          .limit(1);
        integration = rows[0];
        console.log("Fallback integration?", Boolean(integration));
      }

      if (integration) {
        const accessToken = integration.accessToken;
        const targetIgUserId = integration.instagramUserId || igUserId;
        const url = `https://graph.instagram.com/v21.0/${encodeURIComponent(
          targetIgUserId
        )}/messages`;
        console.log("Sending reply to Instagram API", {
          url,
          accessToken,
          senderId,
        });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "instagram",
            recipient: { id: senderId },
            message: { text: "hello." },
          }),
        });

        console.log("Instagram API response status", res.status);

        if (!res.ok) {
          let text: string | undefined;
          try {
            text = await res.text();
          } catch {}
          console.error("instagram reply failed", {
            status: res.status,
            url,
            body: {
              recipient: { id: senderId },
              message: { text: "hello." },
              messaging_product: "instagram",
            },
            response: text,
          });
        }
      }
    }

    console.log("POST completed, returning ok");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("instagram webhook error", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}