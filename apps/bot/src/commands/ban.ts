import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { ModerationCaseType } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { recordModerationCase, requireGuildPermission } from "../services/moderation.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("User to ban").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the ban")
        .setRequired(true)
        .setMaxLength(500),
    )
    .addIntegerOption((option) =>
      option
        .setName("delete_days")
        .setDescription("Days of their messages to delete (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.BanMembers,
      "Ban Members",
    );
    if (!guild) return;

    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;

    await guild.members.ban(user.id, {
      deleteMessageSeconds: deleteDays * 86_400,
      reason,
    });
    const caseNumber = await recordModerationCase({
      guildId: guild.id,
      type: ModerationCaseType.BAN,
      targetDiscordId: user.id,
      actorDiscordId: interaction.user.id,
      reason,
    });

    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "User banned",
          body: `**${user.tag}** was banned — case **#${caseNumber}**.\nReason: ${reason}`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
