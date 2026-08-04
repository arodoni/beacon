import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a GitHub webhook's HMAC-SHA256 signature. Must run against the exact
 * raw request bytes GitHub signed - never against a re-serialized/parsed body.
 */
export function verifySignature(rawBody: Buffer, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signatureHeader, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
