import { ChannelType, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import { updateLogConfig, type LogConfig } from "../services/logging.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("log-config")
    .setDescription("Configure message and member logging channels.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("message_log_channel")
        .setDescription("Channel for message delete/edit logs")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addChannelOption((option) =>
      option
        .setName("member_log_channel")
        .setDescription("Channel for member join/leave/role logs")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addBooleanOption((option) =>
      option.setName("clear").setDescription("Remove all logging channels"),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;

    const clear = interaction.options.getBoolean("clear") ?? false;
    const patch: Partial<LogConfig> = {};
    const messageChannel = interaction.options.getChannel("message_log_channel");
    const memberChannel = interaction.options.getChannel("member_log_channel");
    if (messageChannel && "id" in messageChannel) patch.messageLogChannelId = messageChannel.id;
    if (memberChannel && "id" in memberChannel) patch.memberLogChannelId = memberChannel.id;

    await updateLogConfig(guild, patch, clear);
    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: clear ? "Logging config cleared" : "Logging config saved",
          body: clear
            ? "Message and member logging are now disabled."
            : "Log events will appear in the configured channels.",
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
