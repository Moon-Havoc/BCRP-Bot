import { Events, type GuildBan } from "discord.js";
import type { BotEvent } from "../types.js";
import { sendLogCard } from "../services/logging.js";

const event: BotEvent = {
  name: Events.GuildBanAdd,
  async execute(ban: GuildBan) {
    await sendLogCard(
      ban.guild,
      "memberLogChannelId",
      "Member banned",
      `**${ban.user.tag}** (<@${ban.user.id}>) was banned.\n**Reason:** ${ban.reason ?? "*(none)*"}`,
    );
  },
};

export default event;
