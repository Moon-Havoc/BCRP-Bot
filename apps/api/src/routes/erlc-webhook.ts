import type { FastifyInstance } from "fastify";
import {
  extractWebhookSignatureHeaders,
  verifyWebhookSignature,
} from "../middleware/erlc-webhook-auth.js";
import { createLogger } from "@bcrp/logger";

const logger = createLogger("api-erlc-webhook");

export async function registerErlcWebhookRoutes(app: FastifyInstance): Promise<void> {
  app.post("/webhooks/erlc", async (request, reply) => {
    const rawBody = (request as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      return reply.code(400).send({
        ok: false,
        error: { code: "MISSING_BODY", message: "Raw body is required." },
        requestId: request.id,
      });
    }

    const headers = extractWebhookSignatureHeaders(request.headers as Record<string, unknown>);
    if (!headers) {
      return reply.code(401).send({
        ok: false,
        error: { code: "MISSING_SIGNATURE", message: "Signature headers are required." },
        requestId: request.id,
      });
    }

    const isValid = await verifyWebhookSignature(rawBody, headers);
    if (!isValid) {
      logger.warn({ requestId: request.id }, "Invalid ER:LC webhook signature");
      return reply.code(401).send({
        ok: false,
        error: { code: "INVALID_SIGNATURE", message: "Webhook signature verification failed." },
        requestId: request.id,
      });
    }

    try {
      const payload = JSON.parse(rawBody.toString("utf8"));
      logger.info(
        { requestId: request.id, event: payload?.event, player: payload?.player },
        "ER:LC webhook received",
      );

      // TODO: Forward to Discord bot via internal API or database
      // For now, just acknowledge receipt

      return { ok: true, data: { received: true }, requestId: request.id };
    } catch (error) {
      logger.error({ err: error, requestId: request.id }, "Failed to parse ER:LC webhook");
      return reply.code(400).send({
        ok: false,
        error: { code: "INVALID_JSON", message: "Webhook body is not valid JSON." },
        requestId: request.id,
      });
    }
  });
}
