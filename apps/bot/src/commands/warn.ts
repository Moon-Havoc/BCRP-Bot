import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { ModerationCaseType } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { recordModerationCase, requireGuildPermission } from "../services/moderation.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Issue a warning to a server member.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addUserOption((option) =>
      option.setName("user").setDescription("Member to warn").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the warning")
        .setRequired(true)
        .setMaxLength(500),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageMessages,
      "Manage Messages",
    );
    if (!guild) return;

    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const caseNumber = await recordModerationCase({
      guildId: guild.id,
      type: ModerationCaseType.WARNING,
      targetDiscordId: user.id,
      actorDiscordId: interaction.user.id,
      reason,
    });

    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "Warning issued",
          body: `**${user.tag}** received warning **#${caseNumber}**.\nReason: ${reason}`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
