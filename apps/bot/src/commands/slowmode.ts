import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode for a channel.")
    .addIntegerOption((option) =>
      option
        .setName("seconds")
        .setDescription("Slowmode delay in seconds (0 to disable)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to set slowmode (defaults to current)")
        .addChannelTypes(ChannelType.GuildText),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    if (!interaction.inGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const seconds = interaction.options.getInteger("seconds", true);
    const channel = interaction.options.getChannel("channel") ?? interaction.channel;

    if (!channel || !("setRateLimitPerUser" in channel)) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "Invalid channel type for slowmode.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    try {
      await channel.setRateLimitPerUser(seconds);

      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Slowmode updated",
            body:
              seconds === 0
                ? `Slowmode disabled in **${channel.name}**.`
                : `Slowmode set to **${seconds}** seconds in **${channel.name}**.`,
          }),
          { ephemeral: true },
        ),
      );
    } catch {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "Failed to set slowmode. Check bot permissions.",
          }),
          { ephemeral: true },
        ),
      );
    }
  },
};

export default command;
