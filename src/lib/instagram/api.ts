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