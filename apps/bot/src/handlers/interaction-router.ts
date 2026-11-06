import { Events, type Client } from "discord.js";
import type { BotCommand } from "../types.js";
import type { BcrpLogger } from "@bcrp/logger";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";

export function registerInteractionRouter(
  client: Client,
  commands: Map<string, BotCommand>,
  logger: BcrpLogger,
): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = commands.get(interaction.commandName);
    if (!command) {
      logger.warn({ commandName: interaction.commandName }, "Received an unregistered command");
      await interaction.reply(
        toInteractionReply(
          createTextCard({ title: "Unavailable", body: "This command is not available." }),
          {
            ephemeral: true,
          },
        ),
      );
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(
        { err: error, commandName: interaction.commandName, guildId: interaction.guildId },
        "Command execution failed",
      );
      const response = toInteractionReply(
        createTextCard({
          title: "Something went wrong",
          body: "BCRP could not complete that command. Please try again later.",
        }),
        { ephemeral: true },
      );
      if (interaction.deferred || interaction.replied) await interaction.followUp(response);
      else await interaction.reply(response);
    }
  });
}
