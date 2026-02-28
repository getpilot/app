import { createHmac, timingSafeEqual } from "crypto";

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

  if (receivedSig.length !== expectedSig.length) return false;

  return timingSafeEqual(
    Buffer.from(receivedSig, "hex"),
    Buffer.from(expectedSig, "hex"),
  );
}
