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

  switch (eventType) {
    case "player_join":
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# 🎮 Player Joined\n\n**${player}** has joined the ER:LC server.\n\nWelcome to Beach Coast Roleplay!`,
        ),
      );
      break;

    case "player_leave":
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# 👋 Player Left\n\n**${player}** has left the ER:LC server.\n\nThanks for playing!`,
        ),
      );
      break;

    case "chat": {
      const message = (payload?.message as string) ?? "";
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# 💬 ER:LC Chat\n\n**${player}:** ${message}`),
      );
      break;
    }

    default:
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# 🎮 ER:LC Event\n\n**Event:** ${eventType}\n**Player:** ${player}\n\n\`\`\`json\n${JSON.stringify(payload, null, 2).slice(0, 500)}\n\`\`\``,
        ),
      );
  }

  return container;
}

export default event;
