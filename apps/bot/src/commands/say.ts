import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot send a message.")
    .addStringOption((option) =>
      option.setName("message").setDescription("Message to send").setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to send in (defaults to current)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.inGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const message = interaction.options.getString("message", true);
    const channel = interaction.options.getChannel("channel") ?? interaction.channel;

    if (!channel || !("send" in channel)) {
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
      await channel.send(message);

      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Message sent",
            body: `Message sent to **${channel.name}**.`,
          }),
          { ephemeral: true },
        ),
      );
    } catch {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "Failed to send message. Check bot permissions.",
          }),
          { ephemeral: true },
        ),
      );
    }
  },
};

export default command;
