import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel (prevent @everyone from sending messages).")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to lock (defaults to current)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) return;

    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel("channel") ?? interaction.channel;

    if (!channel || !("permissionOverwrites" in channel)) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "Invalid channel.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
      });

      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Channel locked",
            body: `**${channel.name}** has been locked. @everyone can no longer send messages.`,
          }),
          { ephemeral: true },
        ),
      );
    } catch {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "Failed to lock channel. Check bot permissions.",
          }),
          { ephemeral: true },
        ),
      );
    }
  },
};

export default command;
