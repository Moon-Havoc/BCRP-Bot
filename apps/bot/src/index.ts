import type { Server } from "node:http";
import { loadBotConfig } from "@bcrp/config";
import { createLogger } from "@bcrp/logger";
import { loadCommands } from "./handlers/command-loader.js";
import { loadEvents } from "./handlers/event-loader.js";
import { registerComponentRouter } from "./handlers/component-router.js";
import { registerInteractionRouter } from "./handlers/interaction-router.js";
import { ticketComponentHandlers } from "./components/tickets.js";
import { verificationComponentHandlers } from "./components/verification.js";
import { createHealthServer } from "./services/health-server.js";
import { createBotClient } from "./services/client.js";

async function main(): Promise<void> {
  const config = loadBotConfig();
  const logger = createLogger("bot");
  const commands = await loadCommands();
  const client = createBotClient();

  await loadEvents(client);
  registerInteractionRouter(client, commands, logger);
  registerComponentRouter(
    client,
    new Map([...ticketComponentHandlers(), ...verificationComponentHandlers()]),
    logger,
  );
  client.on("error", (error) => logger.error({ err: error }, "Discord client error"));

  const healthServer = await createHealthServer(
    config.BOT_HEALTH_PORT,
    () => client.isReady(),
    logger,
  );
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down bot");
    client.destroy();
    await closeServer(healthServer);
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await client.login(config.DISCORD_TOKEN);
  } catch (error) {
    logger.fatal({ err: error }, "Bot could not connect to Discord");
    await shutdown("LOGIN_FAILURE");
    process.exitCode = 1;
  }
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

main().catch((error: unknown) => {
  const logger = createLogger("bot");
  logger.fatal({ err: error }, "Bot startup failed");
  process.exitCode = 1;
});
