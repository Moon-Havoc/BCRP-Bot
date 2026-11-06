import { ChannelType, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import { applyVerificationLock, resolveLockTargets } from "../services/channel-lock.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("verify-setup")
    .setDescription("Lock channels so only verified members and staff can view them.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("category")
        .setDescription("Lock every channel inside this category")
        .addChannelTypes(ChannelType.GuildCategory),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Lock a single channel")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addBooleanOption((option) =>
      option.setName("unlock").setDescription("Remove the verification lock instead"),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;

    const category = interaction.options.getChannel("category");
    const channel = interaction.options.getChannel("channel");
    const unlock = interaction.options.getBoolean("unlock") ?? false;

    const targets = resolveLockTargets(
      guild,
      category && "id" in category ? category.id : null,
      channel && "id" in channel ? channel.id : null,
    );
    if (targets.length === 0) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "Nothing to do",
            body: "Provide a category or a channel to lock.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    try {
      const result = await applyVerificationLock(guild, targets, unlock);
      const skipped =
        result.skipped.length > 0
          ? `\nSkipped ${result.skipped.length} protected/invalid channel(s).`
          : "";
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: unlock ? "Channels unlocked" : "Channels locked",
            body: `${unlock ? "Restored" : "Applied"} verification visibility on **${result.locked.length}** channel(s).${skipped}`,
          }),
          { ephemeral: true },
        ),
      );
    } catch (error) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "Setup failed",
            body: error instanceof Error ? error.message : "Could not update channel permissions.",
          }),
          { ephemeral: true },
        ),
      );
    }
  },
};

export default command;
