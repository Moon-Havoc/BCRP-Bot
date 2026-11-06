import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { ModerationCaseType } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import {
  recordModerationCase,
  requireGuildMember,
  requireGuildPermission,
} from "../services/moderation.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("Member to kick").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the kick")
        .setRequired(true)
        .setMaxLength(500),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.KickMembers,
      "Kick Members",
    );
    if (!guild) return;

    const member = requireGuildMember(interaction);
    if (!member) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "Member not found",
            body: "That user is not currently a member of this server.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const reason = interaction.options.getString("reason", true);
    await member.kick(reason);
    const caseNumber = await recordModerationCase({
      guildId: guild.id,
      type: ModerationCaseType.KICK,
      targetDiscordId: member.id,
      actorDiscordId: interaction.user.id,
      reason,
    });

    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "Member kicked",
          body: `**${member.user.tag}** was kicked — case **#${caseNumber}**.\nReason: ${reason}`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
