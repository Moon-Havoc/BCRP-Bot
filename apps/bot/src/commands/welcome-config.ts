import { ChannelType, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import { updateWelcomeConfig, type WelcomeConfig } from "../services/welcome.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("welcome-config")
    .setDescription("Configure welcome messages and member verification.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("welcome_channel")
        .setDescription("Channel for join messages")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addChannelOption((option) =>
      option
        .setName("verify_channel")
        .setDescription("Fallback channel for verification prompts when DMs are closed")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addRoleOption((option) =>
      option.setName("verified_role").setDescription("Role granted after verification"),
    )
    .addStringOption((option) =>
      option
        .setName("rules")
        .setDescription("Rules text shown on the verification prompt")
        .setMaxLength(1000),
    )
    .addBooleanOption((option) =>
      option.setName("clear").setDescription("Remove all welcome/verification settings"),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;

    const clear = interaction.options.getBoolean("clear") ?? false;
    const patch: Partial<WelcomeConfig> = {};
    const welcomeChannel = interaction.options.getChannel("welcome_channel");
    const verifyChannel = interaction.options.getChannel("verify_channel");
    const verifiedRole = interaction.options.getRole("verified_role");
    const rules = interaction.options.getString("rules");

    if (welcomeChannel && "id" in welcomeChannel) patch.welcomeChannelId = welcomeChannel.id;
    if (verifyChannel && "id" in verifyChannel) patch.verifyChannelId = verifyChannel.id;
    if (verifiedRole) patch.verifiedRoleId = verifiedRole.id;
    if (rules !== null) patch.rulesText = rules;

    await updateWelcomeConfig(guild, patch, clear);
    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: clear ? "Welcome config cleared" : "Welcome config saved",
          body: clear
            ? "Welcome messages and verification prompts are now disabled."
            : "Changes apply to new members joining the server.",
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
