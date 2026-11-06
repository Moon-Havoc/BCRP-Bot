import { Events, type Message } from "discord.js";
import type { BotEvent } from "../types.js";
import { sendLogCard, truncate } from "../services/logging.js";

const event: BotEvent = {
  name: Events.MessageDelete,
  async execute(message: Message) {
    if (!message.guild || message.author?.bot) return;
    const content = message.content
      ? `\n**Content:** ${truncate(message.content)}`
      : "\n**Content:** *(unavailable — Message Content intent may be off)*";
    const attachments = message.attachments.size
      ? `\n**Attachments:** ${message.attachments.size}`
      : "";
    await sendLogCard(
      message.guild,
      "messageLogChannelId",
      "Message deleted",
      `**${message.author?.tag ?? "Unknown"}** (<@${message.author?.id ?? "?"}>) in <#${message.channelId}> — message \`${message.id}\`${content}${attachments}`,
    );
  },
};

export default event;
