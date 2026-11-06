import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { recordModerationCase, requireGuildMember } from "../services/moderation.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("tempban")
    .setDescription("Temporarily ban a user (auto-unban after duration).")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to tempban").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("duration").setDescription("Duration (e.g., 1h, 1d, 1w)").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for tempban").setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) return;

    const member = await requireGuildMember(interaction);
    if (!member) return;

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("user", true);
    const durationStr = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason", true);

    // Parse duration (simple parser for h, d, w)
    const match = durationStr.match(/^(\d+)([hdw])$/);
    if (!match) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Invalid duration",
            body: "Use format like: 1h, 1d, 1w (hours, days, weeks)",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const amount = parseInt(match[1]!, 10);
    const unit = match[2]!;
    const milliseconds =
      unit === "h"
        ? amount * 60 * 60 * 1000
        : unit === "d"
          ? amount * 24 * 60 * 60 * 1000
          : amount * 7 * 24 * 60 * 60 * 1000;

    try {
      // Ban the user
      await interaction.guild.members.ban(targetUser.id, {
        reason: `[TEMPBAN ${durationStr}] ${reason} — by ${interaction.user.tag}`,
      });

      // Record the case
      await recordModerationCase({
        guildId: interaction.guild.id,
        actorDiscordId: interaction.user.id,
        targetDiscordId: targetUser.id,
        type: "BAN",
        reason: `[TEMPBAN ${durationStr}] ${reason}`,
      });

      // Schedule auto-unban
      setTimeout(async () => {
        try {
          await interaction.guild!.members.unban(targetUser.id, `Tempban expired (${durationStr})`);
        } catch {
          // Log error but don't crash
        }
      }, milliseconds);

      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "User tempbanned",
            body: `**${targetUser.tag}** has been tempbanned for **${durationStr}**.\n\n**Reason:** ${reason}\n\nThey will be automatically unbanned after the duration expires.`,
          }),
          { ephemeral: true },
        ),
      );
    } catch {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "Failed to tempban user. Check bot permissions.",
          }),
          { ephemeral: true },
        ),
      );
    }
  },
};

export default command;
