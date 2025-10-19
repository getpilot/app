export const IG_API_VERSION = "v23.0";

export async function sendInstagramMessage(params: {
  igUserId: string;
  recipientId: string;
  accessToken: string;
  text: string;
}): Promise<{ status: number; data?: { id?: string; message_id?: string } }> {
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
    const shaped: { id?: string; message_id?: string } | undefined = isObject(
      data
    )
      ? {
          id:
            typeof (data as Record<string, unknown>).id === "string"
              ? ((data as Record<string, unknown>).id as string)
              : undefined,
          message_id:
            typeof (data as Record<string, unknown>).message_id === "string"
              ? ((data as Record<string, unknown>).message_id as string)
              : undefined,
        }
      : undefined;
    return { status: res.status, data: shaped };
  } catch {
    return { status: 500 };
  }
}

export async function fetchConversations(params: {
  accessToken: string;
}): Promise<{ status: number; data: { data?: unknown } }> {
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
    const shaped: { data?: unknown } = isObject(data)
      ? { data: (data as Record<string, unknown>).data }
      : { data: undefined };
    return { status: res.status, data: shaped };
  } catch {
    return { status: 500, data: { data: undefined } };
  }
}

export async function fetchConversationMessages(params: {
  accessToken: string;
  conversationId: string;
  limit?: number;
}): Promise<{ status: number; data: { data?: unknown } }> {
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
    const shaped: { data?: unknown } = isObject(data)
      ? { data: (data as Record<string, unknown>).data }
      : { data: undefined };
    return { status: res.status, data: shaped };
  } catch {
    return { status: 500, data: { data: undefined } };
  }
}

export async function sendInstagramCommentReply(params: {
  igUserId: string;
  commentId: string;
  accessToken: string;
  text: string;
}): Promise<{ status: number; data?: { id?: string; message_id?: string } }> {
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
    const shaped: { id?: string; message_id?: string } | undefined = isObject(
      data
    )
      ? {
          id:
            typeof (data as Record<string, unknown>).id === "string"
              ? ((data as Record<string, unknown>).id as string)
              : undefined,
          message_id:
            typeof (data as Record<string, unknown>).message_id === "string"
              ? ((data as Record<string, unknown>).message_id as string)
              : undefined,
        }
      : undefined;
    return { status: res.status, data: shaped };
  } catch {
    return { status: 500 };
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
}): Promise<{ status: number; data?: { id?: string; message_id?: string } }> {
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
    const shaped: { id?: string; message_id?: string } | undefined = isObject(
      data
    )
      ? {
          id:
            typeof (data as Record<string, unknown>).id === "string"
              ? ((data as Record<string, unknown>).id as string)
              : undefined,
          message_id:
            typeof (data as Record<string, unknown>).message_id === "string"
              ? ((data as Record<string, unknown>).message_id as string)
              : undefined,
        }
      : undefined;
    return { status: res.status, data: shaped };
  } catch {
    return { status: 500 };
  }
}

export async function postPublicCommentReply(params: {
  commentId: string;
  accessToken: string;
  message: string;
}): Promise<{ status: number; data?: { id?: string; message_id?: string } }> {
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
    const shaped: { id?: string; message_id?: string } | undefined = isObject(
      data
    )
      ? {
          id:
            typeof (data as Record<string, unknown>).id === "string"
              ? ((data as Record<string, unknown>).id as string)
              : undefined,
          message_id:
            typeof (data as Record<string, unknown>).message_id === "string"
              ? ((data as Record<string, unknown>).message_id as string)
              : undefined,
        }
      : undefined;
    return { status: res.status, data: shaped };
  } catch {
    return { status: 500 };
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}