import { Events, type Message } from "discord.js";
import type { BotEvent } from "../types.js";
import { sendLogCard, truncate } from "../services/logging.js";

const event: BotEvent = {
  name: Events.MessageUpdate,
  async execute(oldMessage: Message, newMessage: Message) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    if (!oldMessage.content && !newMessage.content) return;

    await sendLogCard(
      newMessage.guild,
      "messageLogChannelId",
      "Message edited",
      `**${newMessage.author?.tag ?? "Unknown"}** (<@${newMessage.author?.id ?? "?"}>) in <#${newMessage.channelId}> — message \`${newMessage.id}\`\n**Before:** ${truncate(oldMessage.content || "*(empty)*")}\n**After:** ${truncate(newMessage.content || "*(empty)*")}`,
    );
  },
};

export default event;
