import { Events, Message, ContainerBuilder, TextDisplayBuilder, MessageFlags } from "discord.js";
import { createLogger } from "@bcrp/logger";
import type { BotEvent } from "../types.js";

const logger = createLogger("bot-erlc-events");
const MARKER = "<!-- BCRP_ERLC_EVENT -->";

const event: BotEvent = {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    // Only process messages from webhooks in guild channels
    if (!message.inGuild() || !message.webhookId) return;
    if (!message.content.includes(MARKER)) return;

    try {
      // Parse the payload from the message content
      const lines = message.content.split("\n");
      const eventLine = lines.find((l) => l.startsWith("**Event:**"));
      const playerLine = lines.find((l) => l.startsWith("**Player:**"));
      const payloadLine = lines.find((l) => l.startsWith("**Payload:**"));

      const eventType = eventLine?.replace("**Event:**", "").trim() ?? "unknown";
      const player = playerLine?.replace("**Player:**", "").trim() ?? "Unknown";
      let payload: Record<string, unknown> = {};

      if (payloadLine) {
        try {
          payload = JSON.parse(payloadLine.replace("**Payload:**", "").trim());
        } catch {
          // Ignore parse errors
        }
      }

      // Build Components V2 card based on event type
      const card = buildErlcEventCard(eventType, player, payload);

      // Post the Components V2 message
      await message.channel.send({
        components: [card],
        flags: MessageFlags.IsComponentsV2,
      });

      // Delete the original webhook message
      await message.delete().catch(() => {
        logger.warn({ messageId: message.id }, "Failed to delete original webhook message");
      });

      logger.info(
        { eventType, player, channelId: message.channelId },
        "ER:LC event re-formatted with Components V2",
      );
    } catch (error) {
      logger.error(
        { err: error, messageId: message.id },
        "Failed to process ER:LC webhook message",
      );
    }
  },
};

function buildErlcEventCard(
  eventType: string,
  player: string,
  payload: Record<string, unknown>,
): ContainerBuilder {
  const container = new ContainerBuilder();

  // Extract common fields from payload
  const accountAge = payload?.accountAge as string | number | undefined;
  const team = payload?.team as string | undefined;
  const callsign = payload?.callsign as string | undefined;
  const location = payload?.location as string | undefined;
  const timestamp = payload?.timestamp as number | undefined;

  switch (eventType) {
    case "player_join": {
      let details = `**Player:** ${player}`;
      if (accountAge) details += `\n**Account Age:** ${accountAge}`;
      if (team) details += `\n**Team:** ${team}`;
      if (callsign) details += `\n**Callsign:** ${callsign}`;
      if (location) details += `\n**Location:** ${location}`;
      if (timestamp) details += `\n**Time:** ${new Date(timestamp).toLocaleString()}`;

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# 🎮 Player Joined\n\n${details}`),
      );
      break;
    }

    case "player_leave": {
      let details = `**Player:** ${player}`;
      if (team) details += `\n**Team:** ${team}`;
      if (callsign) details += `\n**Callsign:** ${callsign}`;
      if (location) details += `\n**Location:** ${location}`;
      if (timestamp) details += `\n**Time:** ${new Date(timestamp).toLocaleString()}`;

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# 👋 Player Left\n\n${details}`),
      );
      break;
    }

    case "chat": {
      const message = (payload?.message as string) ?? "";
      let details = `**Player:** ${player}\n**Message:** ${message}`;
      if (team) details += `\n**Team:** ${team}`;
      if (timestamp) details += `\n**Time:** ${new Date(timestamp).toLocaleString()}`;

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# 💬 ER:LC Chat\n\n${details}`),
      );
      break;
    }

    default: {
      let details = `**Event:** ${eventType}\n**Player:** ${player}`;
      // Add any other payload fields
      Object.entries(payload).forEach(([key, value]) => {
        if (key !== "event" && key !== "player") {
          details += `\n**${key}:** ${value}`;
        }
      });

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# 🎮 ER:LC Event\n\n${details}`),
      );
    }
  }

  return container;
}

export default event;
