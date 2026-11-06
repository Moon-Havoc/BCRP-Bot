import type { FastifyInstance } from "fastify";
import type { ApiConfig } from "@bcrp/config";
import { isValidInternalSecret } from "../middleware/internal-auth.js";

export async function registerHealthRoutes(app: FastifyInstance, config: ApiConfig): Promise<void> {
  app.get("/health", async (request) => ({
    ok: true,
    data: { service: "api", status: "healthy" },
    requestId: request.id,
  }));

  app.get("/internal/status", async (request, reply) => {
    const provided = request.headers["x-bcrp-api-secret"];
    if (
      !isValidInternalSecret(
        typeof provided === "string" ? provided : undefined,
        config.API_AUTH_SECRET,
      )
    ) {
      return reply.code(401).send({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Internal authentication is required." },
        requestId: request.id,
      });
    }
    return {
      ok: true,
      data: { service: "api", status: "healthy" },
      requestId: request.id,
    };
  });
}
