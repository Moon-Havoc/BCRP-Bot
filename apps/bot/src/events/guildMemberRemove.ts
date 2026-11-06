import { Events, type GuildMember } from "discord.js";
import type { BotEvent } from "../types.js";
import { sendLogCard } from "../services/logging.js";

const event: BotEvent = {
  name: Events.GuildMemberRemove,
  async execute(member: GuildMember) {
    await sendLogCard(
      member.guild,
      "memberLogChannelId",
      "Member left",
      `**${member.user.tag}** (<@${member.id}>) left the server. They had **${member.roles.cache.size - 1}** role(s).`,
    );
  },
};

export default event;
