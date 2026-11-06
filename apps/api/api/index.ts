import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApiServer } from "../../src/services/server.js";
import { loadApiConfig } from "@bcrp/config";

const config = loadApiConfig();
const app = createApiServer(config);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to Fastify-compatible format
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const method = req.method ?? "GET";

  // Build Fastify request
  const fastifyReq = {
    method,
    url: url.pathname + url.search,
    headers: req.headers,
    body: req.body,
    rawBody: (req as unknown as { rawBody?: Buffer }).rawBody,
    id: crypto.randomUUID(),
    log: {
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {},
      child: () => ({ info: () => {}, warn: () => {}, error: () => {}, fatal: () => {} }),
    },
  };

  // For now, just return health for GET requests
  if (method === "GET" && url.pathname === "/health") {
    res.status(200).json({ ok: true, data: { service: "api", status: "healthy" } });
    return;
  }

  // For webhook POST, we need proper Fastify handling
  // This is a simplified version - in production you'd want full Fastify integration
  res.status(501).json({
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "Vercel deployment not fully configured yet." },
  });
}
