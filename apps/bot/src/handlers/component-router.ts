import { Events, type ButtonInteraction, type Client } from "discord.js";
import type { BcrpLogger } from "@bcrp/logger";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";

export type ComponentHandler = (interaction: ButtonInteraction) => Promise<void>;

/**
 * Routes button interactions by exact customId. Chat input commands are handled
 * separately by interaction-router.ts.
 */
export function registerComponentRouter(
  client: Client,
  handlers: Map<string, ComponentHandler>,
  logger: BcrpLogger,
): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    // Handlers may register an exact customId or a prefix. A key ending in ":"
    // matches anything below it; other keys only match a ":"-delimited suffix.
    let handler: ComponentHandler | undefined;
    for (const [key, candidate] of handlers) {
      const isPrefix = interaction.customId.startsWith(key);
      const bounded = key.endsWith(":") || interaction.customId.charAt(key.length) === ":";
      if (interaction.customId === key || (isPrefix && bounded)) {
        handler = candidate;
        break;
      }
    }
    if (!handler) {
      logger.warn({ customId: interaction.customId }, "Received an unregistered component");
      await interaction.reply(
        toInteractionReply(
          createTextCard({ title: "Unavailable", body: "This component is not available." }),
          { ephemeral: true },
        ),
      );
      return;
    }
    try {
      await handler(interaction);
    } catch (error) {
      logger.error(
        { err: error, customId: interaction.customId, guildId: interaction.guildId },
        "Component handler failed",
      );
      const response = toInteractionReply(
        createTextCard({
          title: "Something went wrong",
          body: "BCRP could not complete that action. Please try again later.",
        }),
        { ephemeral: true },
      );
      if (interaction.deferred || interaction.replied) await interaction.followUp(response);
      else await interaction.reply(response);
    }
  });
}
