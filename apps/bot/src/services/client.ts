import { Client, GatewayIntentBits } from "discord.js";

/**
 * Guilds is required; GuildMembers enables join/leave events for welcome and
 * verification flows. It is a privileged intent and must be enabled in the
 * Discord Developer Portal.
 */
export function createBotClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.MessageContent,
    ],
  });
}
