import { NextResponse } from "next/server";
import { db } from "@pilot/db";
import {
  contact,
  instagramIntegration,
  sidekickActionLog,
  automation,
} from "@pilot/db/schema";
import { and, eq, desc, gt } from "drizzle-orm";
import { generateReply } from "@/lib/sidekick/reply";
import {
  sendInstagramMessage,
  sendInstagramCommentReply,
  sendInstagramCommentGenericTemplate,
  postPublicCommentReply,
  verifyWebhookSignature,
} from "@pilot/instagram";
import { checkTriggerMatch, logAutomationUsage } from "@/actions/automations";
import { generateAutomationResponse } from "@/lib/automations/ai-response";
import { CommentChange } from "@pilot/types/instagram";
import { classifyHumanResponseNeeded } from "@/lib/sidekick/hrn";
import { inngest } from "@/lib/inngest/client";
import { env } from "@/env";

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

async function upsertContactState(params: {
  contactId: string;
  userId: string;
  messageText: string;
  stage: "new" | "lead" | "follow-up" | "ghosted";
  sentiment: "hot" | "warm" | "cold" | "ghosted" | "neutral";
  leadScore: number;
  requiresHRN: boolean;
  humanResponseSetAt?: Date | null;
}) {
  const now = new Date();
  const {
    contactId,
    userId,
    messageText,
    stage,
    sentiment,
    leadScore,
    requiresHRN,
    humanResponseSetAt,
  } = params;

  const hrnSetAt =
    humanResponseSetAt !== undefined
      ? humanResponseSetAt
      : requiresHRN
        ? now
        : null;

  const row: typeof contact.$inferInsert = {
    id: contactId,
    userId,
    username: null,
    lastMessage: messageText,
    lastMessageAt: now,
    stage,
    sentiment,
    leadScore,
    requiresHumanResponse: requiresHRN,
    humanResponseSetAt: hrnSetAt ?? null,
    updatedAt: now,
    createdAt: now,
  };

  await db
    .insert(contact)
    .values(row)
    .onConflictDoUpdate({
      target: contact.id,
      set: {
        lastMessage: messageText,
        lastMessageAt: now,
        stage,
        sentiment,
        leadScore,
        requiresHumanResponse: requiresHRN,
        humanResponseSetAt: hrnSetAt ?? null,
        updatedAt: now,
      },
    });
}

export async function POST(request: Request) {
  try {
    // ── Webhook Signature Verification ──────────────────────────────
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256");
    const appSecret = env.IG_APP_SECRET ?? "";

    if (!appSecret) {
      console.warn(
        "⚠️ IG_APP_SECRET is not set — all webhooks will be rejected. Set it in .env for production.",
      );
    }

    if (!verifyWebhookSignature(rawBody, signatureHeader, appSecret)) {
      console.error("webhook.signature_invalid", {
        hasSignature: !!signatureHeader,
        hasAppSecret: !!appSecret,
      });
      return new NextResponse("invalid signature", { status: 401 });
    }

    const body = JSON.parse(rawBody) as InstagramWebhookPayload;
    console.log("webhook.received", {
      object: body?.object,
      entryCount: body?.entry?.length ?? 0,
    });

    const entry = body?.entry?.[0];

    const changesUnknown = entry?.changes;
    const changes = Array.isArray(changesUnknown)
      ? (changesUnknown as Array<CommentChange>)
      : undefined;
    if (Array.isArray(changes) && changes.length > 0) {
      console.log(`Processing ${changes.length} changes`);
      for (const change of changes) {
        try {
          console.log("Processing change:", JSON.stringify(change, null, 2));
          const field = change?.field; // e.g., 'comments'
          const value = (change as Partial<CommentChange>)?.value as
            | CommentChange["value"]
            | undefined;
          if (field === "comments" && value && typeof value === "object") {
            console.log("=== COMMENT WEBHOOK DETECTED ===");
            const igUserId = entry?.id; // business account id
            const commentId =
              typeof value?.id === "string" ? value.id : undefined;
            const commenterId =
              typeof value?.from?.id === "string" ? value.from.id : undefined;
            const messageText =
              typeof value?.text === "string" ? value.text : "";

            console.log("Comment details:", {
              igUserId,
              commentId,
              commenterId,
              messageText,
              messageLength: messageText.length,
            });

            if (!igUserId || !commenterId || !messageText) {
              console.log("Skipping comment - missing required fields");
              continue;
            }

            const integration = await db.query.instagramIntegration.findFirst({
              where: eq(instagramIntegration.instagramUserId, igUserId),
            });
            console.log("Integration lookup result:", {
              found: !!integration,
              userId: integration?.userId,
              instagramUserId: integration?.instagramUserId,
            });
            if (!integration) {
              console.log("No integration found - skipping");
              continue;
            }

            const userId = integration.userId;

            console.log("=== CHECKING COMMENT AUTOMATION ===");
            const matchedAutomation = await checkTriggerMatch(
              messageText,
              userId,
              "comment",
            );

            console.log("Automation check result:", {
              found: !!matchedAutomation,
              title: matchedAutomation?.title,
              triggerWord: matchedAutomation?.triggerWord,
              responseType: matchedAutomation?.responseType,
            });

            if (!matchedAutomation) {
              console.log("No automation matched for comment - skipping");
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
                  matchedAutomation.responseContent,
                ) as unknown;
                const elements = Array.isArray(parsed)
                  ? (parsed as Array<unknown>)
                  : null;

                const isValidElement = (
                  el: unknown,
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
                                b,
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
                                  "string",
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
                  if (normalized.length > 1) {
                    // instagram DMs typically display only the first element of a generic template.
                    // send each element as a separate message to ensure all are visible.
                    let lastResult: ResponseLike | undefined;
                    for (const single of normalized) {
                      try {
                        lastResult = await sendInstagramCommentGenericTemplate({
                          igUserId,
                          commentId,
                          accessToken: integration.accessToken,
                          elements: [single],
                        });
                      } catch (sendErr) {
                        console.error(
                          "failed to send generic template element",
                          sendErr,
                        );
                      }
                    }

                    sendRes = lastResult || { status: 200, data: undefined };
                  } else {
                    sendRes = await sendInstagramCommentGenericTemplate({
                      igUserId,
                      commentId,
                      accessToken: integration.accessToken,
                      elements: normalized,
                    });
                  }
                } else {
                  console.error(
                    "generic_template validation failed; falling back to replyText",
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
                  e,
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
                sendRes.data,
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
                    publicRes?.data,
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
      console.log("=== DM WEBHOOK DETECTED ===");
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

        console.log("DM processing details:", {
          targetIgUserId,
          userId,
          messageText,
          messageLength: messageText.length,
          hasAccessToken: !!accessToken,
        });
        const existingContact = await db.query.contact.findFirst({
          where: and(eq(contact.userId, userId), eq(contact.id, senderId)),
        });

        // If the contact already requires human response, update message
        // fields and return immediately — no need to invoke the LLM classifier.
        if (existingContact?.requiresHumanResponse) {
          const now = new Date();
          const stage = existingContact.stage ?? "new";
          const sentiment = existingContact.sentiment ?? "neutral";
          const leadScore = existingContact.leadScore ?? 50;

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
              requiresHumanResponse: true,
              humanResponseSetAt: existingContact.humanResponseSetAt ?? now,
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
                requiresHumanResponse: true,
                humanResponseSetAt: existingContact.humanResponseSetAt ?? now,
                updatedAt: now,
              },
            });

          console.log(
            "Existing HRN flag set; skipping auto-reply until cleared.",
          );
          return NextResponse.json(
            { status: "ok", hrn: true },
            { status: 200 },
          );
        }

        // Only run the HRN classifier when the contact is not already flagged.
        let hrnDecision = {
          hrn: false,
          confidence: 0.1,
          signals: [] as string[],
          reason: "unclassified",
        };
        try {
          hrnDecision = await classifyHumanResponseNeeded({
            message: messageText,
          });
        } catch (e) {
          console.error("HRN classification failed; defaulting to AUTO_OK", e);
        }

        if (hrnDecision.hrn) {
          console.log("HRN detected, pausing auto-reply", hrnDecision);
          const now = new Date();
          const stage = existingContact?.stage ?? "new";
          const sentiment = existingContact?.sentiment ?? "neutral";
          const leadScore = existingContact?.leadScore ?? 50;

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
              requiresHumanResponse: true,
              humanResponseSetAt: now,
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
                requiresHumanResponse: true,
                humanResponseSetAt: now,
                updatedAt: now,
              },
            });

          return NextResponse.json(
            { status: "ok", hrn: true },
            { status: 200 },
          );
        }

        // ── Idempotency: use message ID (mid) + 30s time fallback ────
        const threadId = `${targetIgUserId}:${senderId}`;
        const webhookMid = msg?.message?.mid || null;
        const nowTs = new Date();
        // mid-based dedup: no time bound (reject forever if same mid)
        // time-based fallback: 30s window (only for messages without mid)
        const fallbackWindowStart = new Date(nowTs.getTime() - 30 * 1000);

        if (webhookMid) {
          // Check if we've already processed this exact message ID
          const duplicateMid = await db
            .select()
            .from(sidekickActionLog)
            .where(
              and(
                eq(sidekickActionLog.userId, userId),
                eq(sidekickActionLog.webhookMid, webhookMid),
              ),
            )
            .limit(1);

          if (duplicateMid.length > 0) {
            console.log("webhook.deduplicated", {
              threadId,
              webhookMid,
              reason: "duplicate_mid",
            });
            return NextResponse.json({ status: "ok" }, { status: 200 });
          }
        }

        // Fallback: time-based dedup for messages without mid (30s window)
        const recent = await db
          .select()
          .from(sidekickActionLog)
          .where(
            and(
              eq(sidekickActionLog.userId, userId),
              eq(sidekickActionLog.threadId, threadId),
              gt(sidekickActionLog.createdAt, fallbackWindowStart),
            ),
          )
          .orderBy(desc(sidekickActionLog.createdAt))
          .limit(1);

        if (!webhookMid && recent.length > 0) {
          console.log("webhook.deduplicated", {
            threadId,
            reason: "time_window_fallback",
          });
          return NextResponse.json({ status: "ok" }, { status: 200 });
        }

        try {
          console.log("=== CHECKING DM AUTOMATION ===");
          const matchedAutomation = await checkTriggerMatch(
            messageText,
            userId,
            "dm",
          );

          console.log("DM Automation check result:", {
            found: !!matchedAutomation,
            title: matchedAutomation?.title,
            triggerWord: matchedAutomation?.triggerWord,
            responseType: matchedAutomation?.responseType,
            triggerScope: matchedAutomation?.triggerScope,
            hrnEnforced: matchedAutomation?.hrnEnforced,
          });

          let replyText: string = "";

          if (matchedAutomation) {
            if (matchedAutomation.hrnEnforced) {
              const now = new Date();
              const stage = existingContact?.stage ?? "new";
              const sentiment = existingContact?.sentiment ?? "neutral";
              const leadScore = existingContact?.leadScore ?? 50;

              await upsertContactState({
                contactId: senderId,
                userId,
                messageText,
                stage,
                sentiment,
                leadScore,
                requiresHRN: true,
                humanResponseSetAt: now,
              });

              return NextResponse.json(
                { status: "ok", hrn: true, automationHrn: true },
                { status: 200 },
              );
            }

            console.log("=== AUTOMATION TRIGGERED ===");
            console.log("Automation triggered:", matchedAutomation.title);

            if (matchedAutomation.responseType === "fixed") {
              replyText = matchedAutomation.responseContent;
              console.log("Using fixed response:", replyText);
            } else if (matchedAutomation.responseType === "ai_prompt") {
              console.log("Generating AI automation response...");
              const aiResponse = await generateAutomationResponse({
                prompt: matchedAutomation.responseContent,
                userMessage: messageText,
              });

              console.log("AI response result:", {
                success: !!aiResponse,
                text: aiResponse?.text?.substring(0, 100) + "...",
              });

              if (aiResponse) {
                replyText = aiResponse.text;
              } else {
                console.log(
                  "AI automation response failed, falling back to sidekick",
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
            console.log("=== NO AUTOMATION FOUND - USING SIDEKICK ===");
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

          console.log(
            "Final reply text:",
            replyText?.substring(0, 100) + "...",
          );

          if (replyText) {
            console.log("=== SENDING MESSAGE ===");
            // Single attempt inline — no blocking retries in the webhook handler
            const sendRes = await sendInstagramMessage({
              igUserId: targetIgUserId,
              recipientId: senderId,
              accessToken,
              text: replyText,
            });

            const delivered = sendRes.status >= 200 && sendRes.status < 300;
            const messageId: string | undefined = (() => {
              if (!sendRes.data) return undefined;
              const data = sendRes.data as { id?: string; message_id?: string };
              return data.id || data.message_id || undefined;
            })();

            const now = new Date();
            const leadScore = existingContact?.leadScore ?? 50;
            const stage = existingContact?.stage ?? "new";
            const sentiment = existingContact?.sentiment ?? "neutral";

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

            const actionLogId = crypto.randomUUID();
            await db.insert(sidekickActionLog).values({
              id: actionLogId,
              userId,
              platform: "instagram",
              threadId,
              recipientId: senderId,
              action: "sent_reply",
              text: replyText,
              result: delivered ? "sent" : "failed",
              createdAt: now,
              messageId,
              webhookMid: webhookMid ?? undefined,
            });

            if (delivered) {
              console.log("send.success", {
                userId,
                threadId,
                recipientId: senderId,
                status: sendRes.status,
              });
            }

            // If first attempt failed, queue async retry via Inngest
            // (no blocking retries — respond to Meta immediately)
            if (!delivered) {
              console.error("send.dead_letter_queued", {
                userId,
                threadId,
                recipientId: senderId,
              });
              try {
                await inngest.send({
                  name: "instagram/send-failed",
                  data: {
                    igUserId: targetIgUserId,
                    recipientId: senderId,
                    integrationId: integration.id,
                    text: replyText,
                    userId,
                    threadId,
                    actionLogId,
                  },
                });
              } catch (inngestErr) {
                console.error("Failed to queue dead-letter send", inngestErr);
              }
            }

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

