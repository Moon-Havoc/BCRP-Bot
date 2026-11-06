import { ChannelType, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import { getErlcEventsConfig, updateErlcEventsConfig } from "../services/erlc-events.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("erlc-events")
    .setDescription("Configure ER:LC player join/leave event logging.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel for ER:LC join/leave event cards")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addBooleanOption((option) =>
      option.setName("enabled").setDescription("Enable or disable ER:LC event logging"),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;

    const channel = interaction.options.getChannel("channel");
    const enabled = interaction.options.getBoolean("enabled");

    if (!channel && enabled === null) {
      const config = await getErlcEventsConfig(guild.id);
      const status = config.enabled
        ? `Enabled — posting to <#${config.channelId ?? "unknown"}>`
        : "Disabled";
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "ER:LC Event Logging",
            body: `**Status:** ${status}\n\nUse \`/erlc-events channel:#channel enabled:true\` to configure.`,
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const config = await updateErlcEventsConfig(guild, {
      ...(channel && "id" in channel ? { channelId: channel.id } : {}),
      ...(enabled !== null ? { enabled } : {}),
    });

    const status = config.enabled
      ? `Enabled — posting to <#${config.channelId ?? "unknown"}>`
      : "Disabled";
    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "ER:LC Event Logging Updated",
          body: `**Status:** ${status}`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
