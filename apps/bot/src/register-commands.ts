import { REST, Routes } from "discord.js";
import { loadCommandRegistrationConfig } from "@bcrp/config";
import { createLogger } from "@bcrp/logger";
import { loadCommands } from "./handlers/command-loader.js";

async function registerCommands(): Promise<void> {
  const config = loadCommandRegistrationConfig();
  const logger = createLogger("bot-command-registration");
  const commands = await loadCommands();
  const payload = [...commands.values()].map((command) => command.data.toJSON());
  const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

  const route = config.DISCORD_DEV_GUILD_ID
    ? Routes.applicationGuildCommands(config.DISCORD_APPLICATION_ID, config.DISCORD_DEV_GUILD_ID)
    : Routes.applicationCommands(config.DISCORD_APPLICATION_ID);

  await rest.put(route, { body: payload });
  logger.info(
    {
      commandNames: payload.map((command) => command.name),
      scope: config.DISCORD_DEV_GUILD_ID ? "development guild" : "global",
    },
    "Slash commands registered",
  );
}

registerCommands().catch((error: unknown) => {
  const logger = createLogger("bot-command-registration");
  logger.fatal({ err: error }, "Slash command registration failed");
  process.exitCode = 1;
});
