import { verify } from "@noble/ed25519";
import { hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

const ERLC_WEBHOOK_PUBLIC_KEY_B64 = "MCowBQYDK2VwAyEAjSICb9pp0kHizGQtdG8ySWsDChfGqi+gyFCttigBNOA=";

export interface WebhookSignatureHeaders {
  timestamp: string;
  signature: string;
}

export function extractWebhookSignatureHeaders(
  headers: Record<string, unknown>,
): WebhookSignatureHeaders | null {
  const timestamp = headers["x-signature-timestamp"];
  const signature = headers["x-signature-ed25519"];
  if (typeof timestamp !== "string" || typeof signature !== "string") {
    return null;
  }
  return { timestamp, signature };
}

export async function verifyWebhookSignature(
  rawBody: Buffer,
  headers: WebhookSignatureHeaders,
  maxSkewSeconds = 300,
): Promise<boolean> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const timestampNum = parseInt(headers.timestamp, 10);
    if (isNaN(timestampNum)) return false;
    if (Math.abs(now - timestampNum) > maxSkewSeconds) return false;

    const message = new Uint8Array([...utf8ToBytes(headers.timestamp), ...rawBody]);
    const signatureBytes = hexToBytes(headers.signature);
    const publicKeyBytes = Buffer.from(ERLC_WEBHOOK_PUBLIC_KEY_B64, "base64");

    // Extract the raw public key from SPKI format (last 32 bytes)
    const rawPublicKey = publicKeyBytes.slice(-32);

    return await verify(signatureBytes, message, rawPublicKey);
  } catch {
    return false;
  }
}
