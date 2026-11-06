import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  extractWebhookSignatureHeaders,
  verifyWebhookSignature,
} from "../src/middleware/erlc-webhook-auth.js";
import { createLogger } from "@bcrp/logger";

const logger = createLogger("api-erlc-webhook-vercel");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported." },
    });
    return;
  }

  // Get raw body - Vercel provides it as a Buffer
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
    logger.warn({}, "Invalid ER:LC webhook signature");
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_SIGNATURE", message: "Webhook signature verification failed." },
    });
    return;
  }

  try {
    const payload = JSON.parse(bodyBuffer.toString("utf8"));
    logger.info({ event: payload?.event, player: payload?.player }, "ER:LC webhook received");

    // TODO: Forward to Discord bot via internal API or database
    // For now, just acknowledge receipt

    res.status(200).json({ ok: true, data: { received: true } });
  } catch (error) {
    logger.error({ err: error }, "Failed to parse ER:LC webhook");
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_JSON", message: "Webhook body is not valid JSON." },
    });
  }
}
