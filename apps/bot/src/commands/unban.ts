import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { ModerationCaseType } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { recordModerationCase, requireGuildPermission } from "../services/moderation.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addStringOption((option) =>
      option.setName("user_id").setDescription("Discord user ID to unban").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the unban")
        .setRequired(true)
        .setMaxLength(500),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.BanMembers,
      "Ban Members",
    );
    if (!guild) return;

    const userId = interaction.options.getString("user_id", true);
    const reason = interaction.options.getString("reason", true);

    const banned = await guild.bans.fetch(userId).catch(() => null);
    if (!banned) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "Not banned",
            body: "That user does not have an active ban in this server.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    await guild.bans.remove(userId, reason);
    const caseNumber = await recordModerationCase({
      guildId: guild.id,
      type: ModerationCaseType.UNBAN,
      targetDiscordId: userId,
      actorDiscordId: interaction.user.id,
      reason,
    });

    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "User unbanned",
          body: `**${banned.user.tag}** was unbanned — case **#${caseNumber}**.\nReason: ${reason}`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
