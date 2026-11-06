import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadApiConfig } from "@bcrp/config";
import type { FastifyInstance } from "fastify";
import { createApiServer } from "./server.js";

const secret = "bcrp-local-internal-test-secret-32chars";
let app: FastifyInstance;

beforeEach(() => {
  app = createApiServer(loadApiConfig({ NODE_ENV: "test", API_AUTH_SECRET: secret }));
});

afterEach(async () => app.close());

describe("API foundation routes", () => {
  it("exposes process health without claiming a database check", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      data: { service: "api", status: "healthy" },
    });
  });

  it("protects the internal status route with the configured secret", async () => {
    const denied = await app.inject({ method: "GET", url: "/internal/status" });
    expect(denied.statusCode).toBe(401);

    const allowed = await app.inject({
      method: "GET",
      url: "/internal/status",
      headers: { "x-bcrp-api-secret": secret },
    });
    expect(allowed.statusCode).toBe(200);
  });
});
