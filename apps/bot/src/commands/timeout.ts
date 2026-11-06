import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { ModerationCaseType } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import {
  recordModerationCase,
  requireGuildMember,
  requireGuildPermission,
} from "../services/moderation.js";
import type { BotCommand } from "../types.js";

const MAX_TIMEOUT_MINUTES = 28 * 24 * 60;

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a server member for a duration.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("Member to timeout").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Duration in minutes (max 40320 = 28 days)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(MAX_TIMEOUT_MINUTES),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the timeout")
        .setRequired(true)
        .setMaxLength(500),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ModerateMembers,
      "Moderate Members",
    );
    if (!guild) return;

    const member = requireGuildMember(interaction);
    if (!member) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "Member not found",
            body: "That user is not a member of this server.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("reason", true);
    const expiresAt = new Date(Date.now() + minutes * 60_000);

    await member.timeout(minutes * 60_000, reason);
    const caseNumber = await recordModerationCase({
      guildId: guild.id,
      guild,
      type: ModerationCaseType.TIMEOUT,
      targetDiscordId: member.id,
      actorDiscordId: interaction.user.id,
      reason,
      expiresAt,
    });

    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "Member timed out",
          body: `**${member.user.tag}** was timed out for **${minutes} minutes** — case **#${caseNumber}**.\nReason: ${reason}`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
