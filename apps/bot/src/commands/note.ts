import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { ModerationCaseType } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { recordModerationCase, requireGuildPermission } from "../services/moderation.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("note")
    .setDescription("Add an internal moderation note about a member (no Discord action).")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addUserOption((option) =>
      option.setName("user").setDescription("Member to note").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Note content").setRequired(true).setMaxLength(1000),
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
      guild,
      type: ModerationCaseType.NOTE,
      targetDiscordId: user.id,
      actorDiscordId: interaction.user.id,
      reason,
    });

    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "Note recorded",
          body: `Note **#${caseNumber}** added for **${user.tag}**.`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
