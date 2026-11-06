import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verify } from "@noble/ed25519";
import { hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

const ERLC_WEBHOOK_PUBLIC_KEY_B64 = "MCowBQYDK2VwAyEAjSICb9pp0kHizGQtdG8ySWsDChfGqi+gyFCttigBNOA=";

function extractWebhookSignatureHeaders(headers: Record<string, unknown>) {
  const timestamp = headers["x-signature-timestamp"];
  const signature = headers["x-signature-ed25519"];
  if (typeof timestamp !== "string" || typeof signature !== "string") {
    return null;
  }
  return { timestamp, signature };
}

async function verifyWebhookSignature(
  rawBody: Buffer,
  headers: { timestamp: string; signature: string },
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
    const rawPublicKey = publicKeyBytes.slice(-32);

    return await verify(signatureBytes, message, rawPublicKey);
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported." },
    });
    return;
  }

  // With bodyParsing: false, req.body is a raw Buffer
  const rawBody = req.body as Buffer | string | undefined;
  if (!rawBody) {
    res.status(400).json({
      ok: false,
      error: { code: "MISSING_BODY", message: "Request body is required." },
    });
    return;
  }

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);

  const headers = extractWebhookSignatureHeaders(req.headers as Record<string, unknown>);
  if (!headers) {
    res.status(401).json({
      ok: false,
      error: { code: "MISSING_SIGNATURE", message: "Signature headers are required." },
    });
    return;
  }

  const isValid = await verifyWebhookSignature(bodyBuffer, headers);
  if (!isValid) {
    console.warn("Invalid ER:LC webhook signature");
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_SIGNATURE", message: "Webhook signature verification failed." },
    });
    return;
  }

  try {
    const payload = JSON.parse(bodyBuffer.toString("utf8"));
    console.log("ER:LC webhook received:", { event: payload?.event, player: payload?.player });

    // Store in database for bot to process
    const { prisma } = await import("@bcrp/database");
    await prisma.webhookEvent.create({
      data: {
        source: "erlc",
        eventType: payload?.event ?? "unknown",
        payload,
      },
    });

    res.status(200).json({ ok: true, data: { received: true } });
  } catch (error) {
    console.error("Failed to parse ER:LC webhook:", error);
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_JSON", message: "Webhook body is not valid JSON." },
    });
  }
}
