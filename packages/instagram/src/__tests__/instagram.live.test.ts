import { describe, test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import {
  exchangeCodeForAccessToken,
  exchangeLongLivedInstagramToken,
  fetchConversationMessages,
  fetchConversations,
  fetchInstagramProfile,
  fetchRecentInstagramMedia,
  postPublicCommentReply,
  sendInstagramCommentGenericTemplate,
  sendInstagramCommentReply,
  sendInstagramMessage,
  validateInstagramToken,
} from "../index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "../../.env.test") });

const LIVE = process.env.IG_TEST_LIVE === "1";
const LIVE_WRITE = process.env.IG_TEST_LIVE_WRITE === "1";
const INCLUDE_OAUTH = process.env.IG_TEST_INCLUDE_OAUTH === "1";

const ACCESS_TOKEN = process.env.IG_TEST_ACCESS_TOKEN ?? "";
const CONVERSATION_ID = process.env.IG_TEST_CONVERSATION_ID ?? "";
const IG_USER_ID = process.env.IG_TEST_IG_USER_ID ?? "";
const RECIPIENT_ID = process.env.IG_TEST_RECIPIENT_ID ?? "";
const COMMENT_ID = process.env.IG_TEST_COMMENT_ID ?? "";

const OAUTH_CLIENT_ID = process.env.IG_TEST_INSTAGRAM_CLIENT_ID ?? "";
const OAUTH_CLIENT_SECRET = process.env.IG_TEST_INSTAGRAM_CLIENT_SECRET ?? "";
const OAUTH_REDIRECT_URI = process.env.IG_TEST_REDIRECT_URI ?? "";
const OAUTH_CODE = process.env.IG_TEST_OAUTH_CODE ?? "";

function skipIfDisabled(
  enabled: boolean,
  reason: string,
): string | undefined {
  return enabled ? undefined : reason;
}

describe("@pilot/instagram live (opt-in)", () => {
  test(
    "validateInstagramToken",
    {
      skip: skipIfDisabled(
        LIVE && !!ACCESS_TOKEN,
        "set IG_TEST_LIVE=1 and IG_TEST_ACCESS_TOKEN to run live tests",
      ),
    },
    async () => {
      const valid = await validateInstagramToken({ accessToken: ACCESS_TOKEN });
      assert.equal(valid, true);
    },
  );

  test(
    "fetchInstagramProfile",
    {
      skip: skipIfDisabled(
        LIVE && !!ACCESS_TOKEN,
        "set IG_TEST_LIVE=1 and IG_TEST_ACCESS_TOKEN to run live tests",
      ),
    },
    async () => {
      const profile = await fetchInstagramProfile({ accessToken: ACCESS_TOKEN });
      assert.ok(profile.id);
      assert.ok(profile.username);
    },
  );

  test(
    "fetchRecentInstagramMedia",
    {
      skip: skipIfDisabled(
        LIVE && !!ACCESS_TOKEN,
        "set IG_TEST_LIVE=1 and IG_TEST_ACCESS_TOKEN to run live tests",
      ),
    },
    async () => {
      const media = await fetchRecentInstagramMedia({
        accessToken: ACCESS_TOKEN,
        limit: 5,
      });
      assert.ok(Array.isArray(media));
    },
  );

  test(
    "fetchConversations and fetchConversationMessages",
    {
      skip: skipIfDisabled(
        LIVE && !!ACCESS_TOKEN,
        "set IG_TEST_LIVE=1 and IG_TEST_ACCESS_TOKEN to run live tests",
      ),
    },
    async () => {
      const conversations = await fetchConversations({
        accessToken: ACCESS_TOKEN,
      });
      assert.equal(conversations.status >= 200 && conversations.status < 500, true);

      let chosenConversationId = CONVERSATION_ID;
      if (!chosenConversationId && Array.isArray(conversations.data.data)) {
        const first = conversations.data.data[0] as { id?: string } | undefined;
        if (first?.id) chosenConversationId = first.id;
      }

      if (!chosenConversationId) {
        return;
      }

      const messages = await fetchConversationMessages({
        accessToken: ACCESS_TOKEN,
        conversationId: chosenConversationId,
      });
      assert.equal(messages.status >= 200 && messages.status < 500, true);
    },
  );

  test(
    "write: sendInstagramMessage",
    {
      skip: skipIfDisabled(
        LIVE && LIVE_WRITE && !!ACCESS_TOKEN && !!IG_USER_ID && !!RECIPIENT_ID,
        "set IG_TEST_LIVE=1, IG_TEST_LIVE_WRITE=1, IG_TEST_ACCESS_TOKEN, IG_TEST_IG_USER_ID, IG_TEST_RECIPIENT_ID",
      ),
    },
    async () => {
      const res = await sendInstagramMessage({
        igUserId: IG_USER_ID,
        recipientId: RECIPIENT_ID,
        accessToken: ACCESS_TOKEN,
        text: "pilot instagram package live test message",
      });
      assert.equal(typeof res.status, "number");
    },
  );

  test(
    "write: sendInstagramCommentReply",
    {
      skip: skipIfDisabled(
        LIVE &&
          LIVE_WRITE &&
          !!ACCESS_TOKEN &&
          !!IG_USER_ID &&
          !!COMMENT_ID,
        "set IG_TEST_LIVE=1, IG_TEST_LIVE_WRITE=1, IG_TEST_ACCESS_TOKEN, IG_TEST_IG_USER_ID, IG_TEST_COMMENT_ID",
      ),
    },
    async () => {
      const res = await sendInstagramCommentReply({
        igUserId: IG_USER_ID,
        commentId: COMMENT_ID,
        accessToken: ACCESS_TOKEN,
        text: "pilot instagram package comment reply test",
      });
      assert.equal(typeof res.status, "number");
    },
  );

  test(
    "write: sendInstagramCommentGenericTemplate",
    {
      skip: skipIfDisabled(
        LIVE &&
          LIVE_WRITE &&
          !!ACCESS_TOKEN &&
          !!IG_USER_ID &&
          !!COMMENT_ID,
        "set IG_TEST_LIVE=1, IG_TEST_LIVE_WRITE=1, IG_TEST_ACCESS_TOKEN, IG_TEST_IG_USER_ID, IG_TEST_COMMENT_ID",
      ),
    },
    async () => {
      const res = await sendInstagramCommentGenericTemplate({
        igUserId: IG_USER_ID,
        commentId: COMMENT_ID,
        accessToken: ACCESS_TOKEN,
        elements: [
          {
            title: "pilot test card",
            subtitle: "instagram package live test",
          },
        ],
      });
      assert.equal(typeof res.status, "number");
    },
  );

  test(
    "write: postPublicCommentReply",
    {
      skip: skipIfDisabled(
        LIVE && LIVE_WRITE && !!ACCESS_TOKEN && !!COMMENT_ID,
        "set IG_TEST_LIVE=1, IG_TEST_LIVE_WRITE=1, IG_TEST_ACCESS_TOKEN, IG_TEST_COMMENT_ID",
      ),
    },
    async () => {
      const res = await postPublicCommentReply({
        commentId: COMMENT_ID,
        accessToken: ACCESS_TOKEN,
        message: "pilot instagram package public reply test",
      });
      assert.equal(typeof res.status, "number");
    },
  );

  test(
    "oauth optional: exchangeCodeForAccessToken and exchangeLongLivedInstagramToken",
    {
      skip: skipIfDisabled(
        INCLUDE_OAUTH &&
          !!OAUTH_CLIENT_ID &&
          !!OAUTH_CLIENT_SECRET &&
          !!OAUTH_REDIRECT_URI &&
          !!OAUTH_CODE,
        "set IG_TEST_INCLUDE_OAUTH=1 plus IG_TEST_INSTAGRAM_CLIENT_ID, IG_TEST_INSTAGRAM_CLIENT_SECRET, IG_TEST_REDIRECT_URI, IG_TEST_OAUTH_CODE",
      ),
    },
    async () => {
      const shortLived = await exchangeCodeForAccessToken({
        clientId: OAUTH_CLIENT_ID,
        clientSecret: OAUTH_CLIENT_SECRET,
        redirectUri: OAUTH_REDIRECT_URI,
        code: OAUTH_CODE,
      });
      assert.ok(shortLived.accessToken);

      const longLived = await exchangeLongLivedInstagramToken({
        clientSecret: OAUTH_CLIENT_SECRET,
        accessToken: shortLived.accessToken,
      });
      assert.ok(longLived.accessToken);
      assert.ok(longLived.expiresIn > 0);
    },
  );
});
