export const IG_API_VERSION = "v23.0";

export async function sendInstagramMessage(params: {
  igUserId: string;
  recipientId: string;
  accessToken: string;
  text: string;
}) {
  const { igUserId, recipientId, accessToken, text } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/${encodeURIComponent(
    igUserId
  )}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "instagram",
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    const data = await safeJson(res);
    return { status: res.status, data };
  } catch {
    return { status: 500, data: { error: "network_error" } } as const;
  }
}

export async function fetchConversations(params: { accessToken: string }) {
  const { accessToken } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/me/conversations?fields=participants,updated_time`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    });
    const data = await safeJson(res);
    return { status: res.status, data };
  } catch {
    return { status: 500, data: { error: "network_error" } } as const;
  }
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
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    });
    const data = await safeJson(res);
    return { status: res.status, data };
  } catch {
    return { status: 500, data: { error: "network_error" } } as const;
  }
}

export async function sendInstagramCommentReply(params: {
  igUserId: string;
  commentId: string;
  accessToken: string;
  text: string;
}) {
  const { igUserId, commentId, accessToken, text } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/${encodeURIComponent(
    igUserId
  )}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "instagram",
        recipient: { comment_id: commentId },
        message: { text },
      }),
    });
    const data = await safeJson(res);
    return { status: res.status, data };
  } catch {
    return { status: 500, data: { error: "network_error" } } as const;
  }
}

export async function sendInstagramCommentGenericTemplate(params: {
  igUserId: string;
  commentId: string;
  accessToken: string;
  elements: Array<{
    title: string;
    subtitle?: string;
    image_url?: string;
    default_action?: {
      type: "web_url";
      url: string;
    };
    buttons?: Array<{ type: "web_url"; url: string; title: string }>;
  }>;
}) {
  const { igUserId, commentId, accessToken, elements } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/${encodeURIComponent(
    igUserId
  )}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "instagram",
        recipient: { comment_id: commentId },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements,
            },
          },
        },
      }),
    });
    const data = await safeJson(res);
    return { status: res.status, data };
  } catch {
    return { status: 500, data: { error: "network_error" } } as const;
  }
}

export async function postPublicCommentReply(params: {
  commentId: string;
  accessToken: string;
  message: string;
}) {
  const { commentId, accessToken, message } = params;
  const url = `https://graph.instagram.com/${IG_API_VERSION}/${encodeURIComponent(
    commentId
  )}/replies`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    const data = await safeJson(res);
    return { status: res.status, data };
  } catch {
    return { status: 500, data: { error: "network_error" } } as const;
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}