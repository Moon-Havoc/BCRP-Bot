import { Events, type GuildMember } from "discord.js";
import type { BotEvent } from "../types.js";
import { sendLogCard } from "../services/logging.js";

const event: BotEvent = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    const lines: string[] = [];
    const who = `**${newMember.user.tag}** (<@${newMember.id}>)`;

    if (oldMember.nickname !== newMember.nickname) {
      lines.push(
        `**Nickname:** ${oldMember.nickname ?? "*(none)*"} → ${newMember.nickname ?? "*(none)*"}`,
      );
    }

    const added = newMember.roles.cache.filter(
      (role) => role.id !== newMember.guild.id && !oldMember.roles.cache.has(role.id),
    );
    const removed = oldMember.roles.cache.filter(
      (role) => role.id !== oldMember.guild.id && !newMember.roles.cache.has(role.id),
    );
    if (added.size > 0) lines.push(`**Roles added:** ${added.map((r) => r.name).join(", ")}`);
    if (removed.size > 0) lines.push(`**Roles removed:** ${removed.map((r) => r.name).join(", ")}`);

    const oldTimeout = oldMember.communicationDisabledUntilTimestamp ?? null;
    const newTimeout = newMember.communicationDisabledUntilTimestamp ?? null;
    if (oldTimeout !== newTimeout) {
      lines.push(
        newTimeout
          ? `**Timed out** until <t:${Math.floor(newTimeout / 1000)}:R>`
          : "**Timeout removed**",
      );
    }

    if (lines.length === 0) return;
    await sendLogCard(
      newMember.guild,
      "memberLogChannelId",
      "Member updated",
      `${who}\n${lines.join("\n")}`,
    );
  },
};

export default event;
