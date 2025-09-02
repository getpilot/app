import { NextResponse } from "next/server";
import { sendInstagramMessage } from "@/lib/instagram/api";
import { findIntegrationByIgUserId, findLatestIntegration } from "@/lib/instagram/integration";

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
  }>;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expected = process.env.IG_WEBHOOK_VERIFY_TOKEN;
    if (mode === "subscribe" && challenge) {
      if (!expected || !token || expected === token) {
        return new NextResponse(challenge, { status: 200 });
      }
      return new NextResponse("forbidden", { status: 403 });
    }

    return new NextResponse("ok", { status: 200 });
  } catch {
    return new NextResponse("error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InstagramWebhookPayload;
    const entry = body?.entry?.[0];
    const igUserId = entry?.id;
    const msg = entry?.messaging?.[0];
    const senderId = msg?.sender?.id;
    const hasMessage = Boolean(msg?.message?.text);

    if (igUserId && senderId && hasMessage) {
      let integration = await findIntegrationByIgUserId(igUserId);
      if (!integration) integration = await findLatestIntegration();

      if (integration?.accessToken) {
        const res = await sendInstagramMessage({
          igUserId: integration.instagramUserId || igUserId,
          recipientId: senderId,
          accessToken: integration.accessToken,
          text: "hello.",
        });

        if (res.status < 200 || res.status >= 300) {
          console.error("instagram send failed", res.status, res.data);
        }
      } else {
        console.error("no instagram integration available for webhook igUserId", igUserId);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("instagram webhook error", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}