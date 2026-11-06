import { Events } from "discord.js";
import { createLogger } from "@bcrp/logger";
import type { BotEvent } from "../types.js";

const logger = createLogger("bot");

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const readyClient = client as { user?: { tag?: string }; guilds?: { cache: { size: number } } };
    logger.info(
      { username: readyClient.user?.tag, guildCount: readyClient.guilds?.cache.size ?? 0 },
      "Discord Gateway ready",
    );
  },
};

export default event;
