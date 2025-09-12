import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  contact,
  instagramIntegration,
  sidekickActionLog,
  automation,
} from "@/lib/db/schema";
import { and, eq, desc, gt } from "drizzle-orm";
import { generateReply } from "@/lib/sidekick/reply";
import {
  sendInstagramMessage,
  sendInstagramCommentReply,
  sendInstagramCommentGenericTemplate,
  postPublicCommentReply,
} from "@/lib/instagram/api";
import { checkTriggerMatch, logAutomationUsage } from "@/actions/automations";
import { generateAutomationResponse } from "@/lib/automations/ai-response";
import { CommentChange } from "@/types/instagram";

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
      if (expected && token && expected === token) {
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
      message?: { text?: string; mid?: string; is_echo?: boolean };
    }>;
    changes?: Array<unknown>;
  }>;
};

type GenericTemplateButton = {
  type: string;
  title: string;
  url?: string;
};
type GenericTemplateElement = {
  title?: string;
  text?: string;
  image_url?: string;
  subtitle?: string;
  default_action?: { type: "web_url"; url: string };
  buttons?: GenericTemplateButton[];
  [key: string]: unknown;
};

export async function POST(request: Request) {
  try {
    console.log("POST request received");
    const body = (await request.json()) as InstagramWebhookPayload;
    console.log("POST body", body);

    const entry = body?.entry?.[0];
    console.log("Entry", entry);

    const changesUnknown = entry?.changes;
    const changes = Array.isArray(changesUnknown)
      ? (changesUnknown as Array<CommentChange>)
      : undefined;
    if (Array.isArray(changes) && changes.length > 0) {
      for (const change of changes) {
        try {
          const field = change?.field; // e.g., 'comments'
          const value = (change as Partial<CommentChange>)?.value as
            | CommentChange["value"]
            | undefined;
          if (field === "comments" && value && typeof value === "object") {
            const igUserId = entry?.id; // business account id
            const commentId =
              typeof value?.id === "string" ? value.id : undefined;
            const commenterId =
              typeof value?.from?.id === "string" ? value.from.id : undefined;
            const messageText =
              typeof value?.text === "string" ? value.text : "";

            if (!igUserId || !commenterId || !messageText) {
              continue;
            }

            const integration = await db.query.instagramIntegration.findFirst({
              where: eq(instagramIntegration.instagramUserId, igUserId),
            });
            if (!integration) continue;

            const userId = integration.userId;

            const matchedAutomation = await checkTriggerMatch(
              messageText,
              userId,
              "comment"
            );

            if (!matchedAutomation) {
              continue;
            }

            let replyText: string = "";
            const useGenericTemplate =
              matchedAutomation.responseType === "generic_template";
            if (matchedAutomation.responseType === "fixed") {
              replyText = matchedAutomation.responseContent;
            } else if (matchedAutomation.responseType === "ai_prompt") {
              const aiResponse = await generateAutomationResponse({
                prompt: matchedAutomation.responseContent,
                userMessage: messageText,
              });
              if (aiResponse) {
                replyText = aiResponse.text;
              } else {
                replyText = "Thanks for your comment! We'll follow up in DMs.";
              }
            }

            if (!useGenericTemplate && !replyText) {
              continue;
            }

            if (!commentId) {
              console.error("Missing commentId for reply");
              continue;
            }

            type ResponseLike = {
              status: number;
              data?: { id?: string; message_id?: string };
            };
            let sendRes: ResponseLike | undefined;
            if (useGenericTemplate) {
              // expect responseContent to be a JSON string of elements per FB docs
              // IMPORTANT: user must provide valid elements array
              try {
                const parsed = JSON.parse(
                  matchedAutomation.responseContent
                ) as unknown;
                const elements = Array.isArray(parsed)
                  ? (parsed as Array<unknown>)
                  : null;

                const isValidElement = (
                  el: unknown
                ): el is GenericTemplateElement => {
                  if (!el || typeof el !== "object") return false;
                  // minimal required shape: title OR text, optional image_url, default_action/buttons may exist
                  const rec = el as Record<string, unknown>;
                  const titleOrText = rec.title ?? rec.text;
                  const hasTitleOrText =
                    typeof titleOrText === "string" &&
                    titleOrText.trim().length > 0;
                  if (!hasTitleOrText) return false;
                  if (rec.buttons !== undefined) {
                    const btns = rec.buttons as unknown;
                    if (!Array.isArray(btns)) return false;
                    for (const b of btns) {
                      if (!b || typeof b !== "object") return false;
                      const btn = b as Record<string, unknown>;
                      if (typeof btn.type !== "string") return false;
                      if (btn.type === "web_url" && typeof btn.url !== "string")
                        return false;
                      if (typeof btn.title !== "string") return false;
                    }
                  }
                  return true;
                };
                if (
                  elements &&
                  elements.length > 0 &&
                  elements.every(isValidElement)
                ) {
                  const normalized = elements.map((raw) => {
                    const rec = raw as GenericTemplateElement;
                    const title =
                      rec.title && typeof rec.title === "string"
                        ? rec.title
                        : (rec.text as string);
                    const element = {
                      title,
                      subtitle:
                        typeof rec.subtitle === "string"
                          ? rec.subtitle
                          : undefined,
                      image_url:
                        typeof rec.image_url === "string"
                          ? rec.image_url
                          : undefined,
                      default_action:
                        rec.default_action &&
                        rec.default_action.type === "web_url" &&
                        typeof rec.default_action.url === "string"
                          ? {
                              type: "web_url" as const,
                              url: rec.default_action.url,
                            }
                          : undefined,
                      buttons: Array.isArray(rec.buttons)
                        ? rec.buttons
                            .filter(
                              (
                                b
                              ): b is {
                                type: "web_url";
                                url: string;
                                title: string;
                              } =>
                                !!b &&
                                typeof b === "object" &&
                                (b as GenericTemplateButton).type ===
                                  "web_url" &&
                                typeof (b as GenericTemplateButton).url ===
                                  "string" &&
                                typeof (b as GenericTemplateButton).title ===
                                  "string"
                            )
                            .map((b) => ({
                              type: "web_url" as const,
                              url: b.url,
                              title: b.title,
                            }))
                        : undefined,
                    };
                    return element;
                  });
                  sendRes = await sendInstagramCommentGenericTemplate({
                    igUserId,
                    commentId,
                    accessToken: integration.accessToken,
                    elements: normalized,
                  });
                } else {
                  console.error(
                    "generic_template validation failed; falling back to replyText"
                  );
                  if (!replyText) continue;
                  sendRes = await sendInstagramCommentReply({
                    igUserId,
                    commentId,
                    accessToken: integration.accessToken,
                    text: replyText,
                  });
                }
              } catch (e) {
                console.error(
                  "invalid generic_template payload; falling back",
                  e
                );
                if (!replyText) continue;
                sendRes = await sendInstagramCommentReply({
                  igUserId,
                  commentId,
                  accessToken: integration.accessToken,
                  text: replyText,
                });
              }
            } else {
              sendRes = await sendInstagramCommentReply({
                igUserId,
                commentId,
                accessToken: integration.accessToken,
                text: replyText,
              });
            }

            const delivered =
              sendRes &&
              typeof sendRes.status === "number" &&
              sendRes.status >= 200 &&
              sendRes.status < 300;
            const messageId =
              (sendRes &&
                sendRes.data &&
                (sendRes.data.id || sendRes.data.message_id)) ||
              undefined;

            if (!delivered) {
              console.error(
                "instagram comment private reply failed",
                sendRes.status,
                sendRes.data
              );
            }

            const threadId = `${igUserId}:comment:${commentId ?? "unknown"}`;

            await logAutomationUsage({
              userId,
              platform: "instagram",
              threadId,
              recipientId: commenterId,
              automationId: matchedAutomation.id,
              triggerWord: matchedAutomation.triggerWord,
              action: "comment_automation_triggered",
              text: replyText,
              messageId,
            });

            // optionally post a public reply comment if configured on the automation
            const commentReplyText = (
              matchedAutomation as { commentReplyText?: string | null }
            ).commentReplyText;
            const shouldPublicReply =
              typeof commentReplyText === "string" &&
              commentReplyText.trim().length > 0;
            if (shouldPublicReply && commentId) {
              try {
                const publicRes = await postPublicCommentReply({
                  commentId,
                  accessToken: integration.accessToken,
                  message: commentReplyText as string,
                });
                if (
                  !publicRes ||
                  publicRes.status < 200 ||
                  publicRes.status >= 300
                ) {
                  console.error(
                    "instagram public comment reply failed",
                    publicRes?.status,
                    publicRes?.data
                  );
                }
              } catch (e) {
                console.error("failed to send public comment reply", e);
              }
            }

            try {
              await db
                .update(automation)
                .set({
                  commentReplyCount:
                    (matchedAutomation.commentReplyCount ?? 0) + 1,
                  updatedAt: new Date(),
                })
                .where(eq(automation.id, matchedAutomation.id));
            } catch (incErr) {
              console.warn("failed to increment comment_reply_count", incErr);
            }
          }
        } catch (innerErr) {
          console.error("Error processing change entry", innerErr);
          // continue processing remaining changes
        }
      }

      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const igUserId = entry?.id;
    const msg = entry?.messaging?.[0];
    console.log("Message", msg);
    const senderId = msg?.sender?.id;
    const messageText = msg?.message?.text || "";
    const hasMessage = Boolean(messageText);
    const isEcho = Boolean(msg?.message?.is_echo);

    console.log("igUserId", igUserId);
    console.log("senderId", senderId);
    console.log("hasMessage", hasMessage);

    if (isEcho || senderId === igUserId) {
      console.log("Skipping echo/self message");
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    if (igUserId && senderId && hasMessage) {
      console.log("Looking up integration for igUserId", igUserId);
      const integration = await db.query.instagramIntegration.findFirst({
        where: eq(instagramIntegration.instagramUserId, igUserId),
      });
      console.log("Integration found by igUserId?", Boolean(integration));

      if (!integration) {
        console.error("No matching integration found for igUserId:", igUserId);
        return NextResponse.json({ status: "ok" }, { status: 200 });
      }

      if (integration) {
        const accessToken = integration.accessToken;
        const targetIgUserId = integration.instagramUserId || igUserId;
        const userId = integration.userId;

        // idempotency: if we already sent a reply for this thread very recently, skip
        const threadId = `${targetIgUserId}:${senderId}`;
        const nowTs = new Date();
        const windowStart = new Date(nowTs.getTime() - 10 * 1000);
        const recent = await db
          .select()
          .from(sidekickActionLog)
          .where(
            and(
              eq(sidekickActionLog.userId, userId),
              eq(sidekickActionLog.threadId, threadId),
              gt(sidekickActionLog.createdAt, windowStart)
            )
          )
          .orderBy(desc(sidekickActionLog.createdAt))
          .limit(1);
        if (recent.length > 0) {
          console.log("Skipping due to recent reply in idempotency window");
          return NextResponse.json({ status: "ok" }, { status: 200 });
        }

        try {
          const matchedAutomation = await checkTriggerMatch(
            messageText,
            userId,
            "dm"
          );

          let replyText: string = "";

          if (matchedAutomation) {
            console.log("Automation triggered:", matchedAutomation.title);

            if (matchedAutomation.responseType === "fixed") {
              replyText = matchedAutomation.responseContent;
            } else if (matchedAutomation.responseType === "ai_prompt") {
              const aiResponse = await generateAutomationResponse({
                prompt: matchedAutomation.responseContent,
                userMessage: messageText,
              });

              if (aiResponse) {
                replyText = aiResponse.text;
              } else {
                console.log(
                  "AI automation response failed, falling back to sidekick"
                );
                const sidekickReply = await generateReply({
                  userId,
                  igUserId: targetIgUserId,
                  senderId,
                  text: messageText,
                  accessToken,
                });

                if (!sidekickReply) {
                  console.log("No reply generated; skipping send.");
                  return NextResponse.json({ status: "ok" }, { status: 200 });
                }

                replyText = sidekickReply.text;
              }
            }
          } else {
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

            replyText = reply.text;
          }

          const sendRes = await sendInstagramMessage({
            igUserId: targetIgUserId,
            recipientId: senderId,
            accessToken,
            text: replyText,
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
            threadId,
            recipientId: senderId,
            action: "sent_reply",
            text: replyText,
            result: delivered ? "sent" : "failed",
            createdAt: now,
            messageId,
          });

          if (matchedAutomation) {
            const scope = matchedAutomation.triggerScope || "dm";
            const action =
              scope === "both"
                ? "dm_and_comment_automation_triggered"
                : scope === "comment"
                ? "comment_automation_triggered"
                : "dm_automation_triggered";
            await logAutomationUsage({
              userId,
              platform: "instagram",
              threadId,
              recipientId: senderId,
              automationId: matchedAutomation.id,
              triggerWord: matchedAutomation.triggerWord,
              action,
              text: replyText,
              messageId,
            });
          }
        } catch (e) {
          const err = e as unknown as { message?: string; stack?: string };
          console.error("generateReply/send flow failed", {
            message: err?.message,
            stack: err?.stack,
          });
          return NextResponse.json({ status: "ok" }, { status: 200 });
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