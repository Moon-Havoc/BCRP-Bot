import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { recordModerationCase, requireGuildMember } from "../services/moderation.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Ban and immediately unban a user (for message cleanup).")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to softban").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for softban").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("delete_days")
        .setDescription("Days of messages to delete (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) return;

    const member = await requireGuildMember(interaction);
    if (!member) return;

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;

    try {
      // Ban the user
      await interaction.guild.members.ban(targetUser.id, {
        reason: `[SOFTBAN] ${reason} — by ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      // Immediately unban
      await interaction.guild.members.unban(targetUser.id, "Softban complete");

      // Record the case
      await recordModerationCase({
        guildId: interaction.guild.id,
        actorDiscordId: interaction.user.id,
        targetDiscordId: targetUser.id,
        type: "BAN",
        reason: `[SOFTBAN] ${reason}`,
      });

      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "User softbanned",
            body: `**${targetUser.tag}** has been softbanned.\n\n**Reason:** ${reason}\n**Messages deleted:** ${deleteDays} day(s)`,
          }),
          { ephemeral: true },
        ),
      );
    } catch {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "Failed to softban user. Check bot permissions.",
          }),
          { ephemeral: true },
        ),
      );
    }
  },
};

export default command;
