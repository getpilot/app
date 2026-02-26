import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify the HMAC-SHA256 signature on an incoming Instagram / Meta webhook.
 *
 * Meta sends the header `X-Hub-Signature-256` in the format `sha256=<hex>`.
 * We recompute the HMAC using the raw request body and the Facebook App Secret
 * and compare in constant time to avoid timing attacks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") return false;

  const receivedSig = parts[1]!;
  const expectedSig = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Guard against length mismatch before timingSafeEqual
  if (receivedSig.length !== expectedSig.length) return false;

  return timingSafeEqual(
    Buffer.from(receivedSig, "hex"),
    Buffer.from(expectedSig, "hex"),
  );
}