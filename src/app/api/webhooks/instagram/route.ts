import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  contact,
  instagramIntegration,
  sidekickActionLog,
} from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { generateReply } from "@/lib/sidekick/reply";
import { sendInstagramMessage } from "@/lib/instagram/api";

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
    const messageText = msg?.message?.text || "";
    const hasMessage = Boolean(messageText);

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
        const userId = integration.userId;

        const reply = await generateReply({
          userId,
          igUserId: targetIgUserId,
          senderId,
          text: messageText,
          accessToken,
        });

        if (!reply) {
          console.log("No reply generated; skipping send.");
          return NextResponse.json({ status: "ok" }, { status: 200 });
        }

        const sendRes = await sendInstagramMessage({
          igUserId: targetIgUserId,
          recipientId: senderId,
          accessToken,
          text: reply.text,
        });

        const delivered = sendRes.status >= 200 && sendRes.status < 300;
        const messageId =
          (sendRes.data && (sendRes.data.id || sendRes.data.message_id)) ||
          undefined;

        if (!delivered) {
          console.error("instagram send failed", sendRes.status, sendRes.data);
        }

        const now = new Date();
        const leadScore = 50;
        const stage = "new";
        const sentiment = "neutral";

        await db
          .insert(contact)
          .values({
            id: senderId,
            userId,
            username: null,
            lastMessage: messageText,
            lastMessageAt: now,
            stage,
            sentiment,
            leadScore,
            updatedAt: now,
            createdAt: now,
          })
          .onConflictDoUpdate({
            target: contact.id,
            set: {
              lastMessage: messageText,
              lastMessageAt: now,
              stage,
              sentiment,
              leadScore,
              updatedAt: now,
            },
          });

        await db.insert(sidekickActionLog).values({
          id: crypto.randomUUID(),
          userId,
          platform: "instagram",
          threadId: `${targetIgUserId}:${senderId}`,
          recipientId: senderId,
          action: "sent_reply",
          text: reply.text,
          result: delivered ? "sent" : ("sent" as const),
          createdAt: now,
          messageId,
        });
      }
    }

    console.log("POST completed, returning ok");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("instagram webhook error", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}