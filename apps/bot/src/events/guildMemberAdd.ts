import { Events, MessageFlags, type GuildMember } from "discord.js";
import { createLogger } from "@bcrp/logger";
import type { BotEvent } from "../types.js";
import { buildWelcomeCard, getWelcomeConfig, sendVerifyPrompt } from "../services/welcome.js";
import { sendLogCard } from "../services/logging.js";

const logger = createLogger("bot-welcome");

const event: BotEvent = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    try {
      const config = await getWelcomeConfig(member.guild.id);

      if (config.welcomeChannelId) {
        const channel = await member.guild.channels.fetch(config.welcomeChannelId);
        if (channel?.isTextBased() && "send" in channel) {
          await channel.send({
            components: [buildWelcomeCard(member)],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { users: [member.id] },
          });
        }
      }

      if (config.verifiedRoleId) {
        await sendVerifyPrompt(member, config);
      }

      await sendLogCard(
        member.guild,
        "memberLogChannelId",
        "Member joined",
        `**${member.user.tag}** (<@${member.id}>) joined the server. Account created <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>.`,
      );
    } catch (error) {
      logger.error(
        { err: error, guildId: member.guild.id, userId: member.id },
        "Welcome/verification flow failed",
      );
    }
  },
};

export default event;
