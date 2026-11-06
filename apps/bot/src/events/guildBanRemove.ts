import { Events, type GuildBan } from "discord.js";
import type { BotEvent } from "../types.js";
import { sendLogCard } from "../services/logging.js";

const event: BotEvent = {
  name: Events.GuildBanRemove,
  async execute(ban: GuildBan) {
    await sendLogCard(
      ban.guild,
      "memberLogChannelId",
      "Member unbanned",
      `**${ban.user.tag}** (<@${ban.user.id}>) was unbanned.\n**Reason:** ${ban.reason ?? "*(none)*"}`,
    );
  },
};

export default event;
