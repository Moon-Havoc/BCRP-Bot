import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import type { ApiConfig } from "@bcrp/config";
import { registerHealthRoutes } from "../routes/health.js";
import { registerErlcWebhookRoutes } from "../routes/erlc-webhook.js";

export function createApiServer(config: ApiConfig): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      base: { service: "api", environment: config.NODE_ENV },
      redact: {
        paths: ["*.token", "*.secret", "*.authorization", "*.cookie", "*.apiKey", "*.serverKey"],
        censor: "[REDACTED]",
      },
    },
    genReqId: () => randomUUID(),
  });

  app.setErrorHandler((error, request, reply) => {
    const validationError =
      error instanceof Error && "validation" in error && error.validation !== undefined;
    request.log[validationError ? "warn" : "error"](
      { err: error, requestId: request.id },
      "API request failed",
    );
    return reply.code(validationError ? 400 : 500).send({
      ok: false,
      error: {
        code: validationError ? "VALIDATION_ERROR" : "INTERNAL_ERROR",
        message: validationError
          ? "Request validation failed."
          : "The API could not complete the request.",
      },
      requestId: request.id,
    });
  });

  void registerHealthRoutes(app, config);
  void registerErlcWebhookRoutes(app);

  // Add raw body parser for webhook signature verification
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (req, body, done) => {
    try {
      const json = JSON.parse((body as Buffer).toString("utf8"));
      (req as unknown as { rawBody: Buffer }).rawBody = body as Buffer;
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  return app;
}
