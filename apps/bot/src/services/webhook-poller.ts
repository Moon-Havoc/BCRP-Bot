import { prisma } from "@bcrp/database";
import { createLogger } from "@bcrp/logger";
import type { Client } from "discord.js";

const logger = createLogger("bot-webhook-poller");
const POLL_INTERVAL_MS = 5000;

export function startWebhookPoller(client: Client): void {
  const poll = async () => {
    try {
      const events = await prisma.webhookEvent.findMany({
        where: { processed: false },
        orderBy: { createdAt: "asc" },
        take: 10,
      });

      for (const event of events) {
        try {
          await processWebhookEvent(client, event);
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { processed: true, processedAt: new Date() },
          });
        } catch (error) {
          logger.error({ err: error, eventId: event.id }, "Failed to process webhook event");
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { error: error instanceof Error ? error.message : "Unknown error" },
          });
        }
      }
    } catch (error) {
      logger.error({ err: error }, "Webhook poller error");
    }
  };

  setInterval(() => void poll(), POLL_INTERVAL_MS);
  void poll();
  logger.info("Webhook poller started");
}

async function processWebhookEvent(
  client: Client,
  event: { id: string; source: string; eventType: string; payload: unknown },
): Promise<void> {
  if (event.source !== "erlc") return;

  const payload = event.payload as Record<string, unknown>;
  const eventName = payload?.event as string | undefined;
  const player = payload?.player as string | undefined;

  // Get the first guild the bot is in (for now - single guild setup)
  const guild = client.guilds.cache.first();
  if (!guild) {
    logger.warn("No guild available for webhook forwarding");
    return;
  }

  // Find a channel to send to (use system channel or first text channel)
  const channel = guild.systemChannel ?? guild.channels.cache.find((c) => c.isTextBased());
  if (!channel || !("send" in channel)) {
    logger.warn("No suitable channel found for webhook forwarding");
    return;
  }

  let message: string;
  switch (eventName) {
    case "player_join":
      message = `🎮 **ER:LC:** ${player ?? "A player"} joined the server.`;
      break;
    case "player_leave":
      message = `🎮 **ER:LC:** ${player ?? "A player"} left the server.`;
      break;
    case "chat":
      message = `💬 **ER:LC Chat:** ${player ?? "Unknown"}: ${payload?.message ?? ""}`;
      break;
    default:
      message = `🎮 **ER:LC Event:** ${eventName ?? "unknown"} - ${JSON.stringify(payload).slice(0, 200)}`;
  }

  await channel.send(message);
  logger.info({ eventId: event.id, eventName }, "Webhook event forwarded to Discord");
}
