import { loadApiConfig } from "@bcrp/config";
import { createLogger } from "@bcrp/logger";
import { createApiServer } from "./services/server.js";

async function main(): Promise<void> {
  const config = loadApiConfig();
  const app = createApiServer(config);

  try {
    await app.listen({ host: config.API_HOST, port: config.API_PORT });
    app.log.info({ host: config.API_HOST, port: config.API_PORT }, "BCRP API is listening");
  } catch (error) {
    app.log.fatal({ err: error }, "API startup failed");
    process.exitCode = 1;
    return;
  }

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Shutting down API");
    await app.close();
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  const logger = createLogger("api");
  logger.fatal({ err: error }, "API configuration failed");
  process.exitCode = 1;
});
