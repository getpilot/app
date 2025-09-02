import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  contact,
  instagramIntegration,
  sidekickActionLog,
  sidekickSetting,
} from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { generateReply } from "@/lib/sidekick/reply";
import { sendInstagramMessage } from "@/lib/instagram/api";

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
        });

        if (!reply) {
          console.log("No reply generated; skipping send.");
          return NextResponse.json({ status: "ok" }, { status: 200 });
        }

        // load confidence threshold (default 0.8)
        const settings = await db.query.sidekickSetting.findFirst({
          where: eq(sidekickSetting.userId, userId),
        });
        const threshold = settings?.confidenceThreshold ?? 0.8;

        if (reply.confidence >= threshold) {
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
            console.error(
              "instagram send failed",
              sendRes.status,
              sendRes.data
            );
          }

          const now = new Date();
          const leadScore = Math.round(
            Math.min(1, Math.max(0, reply.confidence)) * 100
          );
          const stage =
            reply.confidence >= 0.9
              ? "lead"
              : reply.confidence >= 0.8
              ? "follow-up"
              : "new";
          const sentiment = reply.confidence >= 0.85 ? "warm" : "neutral";

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
            confidence: reply.confidence,
            result: delivered ? "sent" : ("sent" as const),
            createdAt: now,
            messageId,
          });
        } else {
          console.log(
            `Confidence ${reply.confidence} below threshold ${threshold}; not sending.`
          );
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