import axios from "axios";

export const IG_API_VERSION = "v23.0";

export async function sendInstagramMessage(params: {
  igUserId: string;
  recipientId: string;
  accessToken: string;
  text: string;
}) {
  const { igUserId, recipientId, accessToken, text } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/${encodeURIComponent(igUserId)}/messages`;

  return axios.post(
    url,
    {
      messaging_product: "instagram",
      recipient: { id: recipientId },
      message: { text },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
      validateStatus: () => true,
    }
  );
}

export async function fetchConversations(params: {
  accessToken: string;
}) {
  const { accessToken } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/me/conversations?fields=participants,updated_time`;
  return axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    timeout: 10000,
    validateStatus: () => true,
  });
}

export async function fetchConversationMessages(params: {
  accessToken: string;
  conversationId: string;
  limit?: number;
}) {
  const { accessToken, conversationId, limit = 10 } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/${encodeURIComponent(
    conversationId
  )}/messages?fields=from{id,username},message,created_time&limit=${limit}`;
  return axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    timeout: 10000,
    validateStatus: () => true,
  });
}

export async function sendInstagramCommentReply(params: {
  igUserId: string;
  commentId: string;
  accessToken: string;
  text: string;
}) {
  const { igUserId, commentId, accessToken, text } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/${encodeURIComponent(igUserId)}/messages`;

  return axios.post(
    url,
    {
      messaging_product: "instagram",
      recipient: { comment_id: commentId },
      message: { text },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
      validateStatus: () => true,
    }
  );
}