import { createServer, type Server } from "node:http";
import type { BcrpLogger } from "@bcrp/logger";

export function createHealthServer(
  port: number,
  isReady: () => boolean,
  logger: BcrpLogger,
): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      if (request.url !== "/health" || request.method !== "GET") {
        response.writeHead(404).end();
        return;
      }
      const ready = isReady();
      response.writeHead(ready ? 200 : 503, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: ready, service: "bot", gatewayReady: ready }));
    });
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      logger.info({ port, host: "127.0.0.1" }, "Bot health endpoint listening");
      resolve(server);
    });
  });
}
