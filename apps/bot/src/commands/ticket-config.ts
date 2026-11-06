import { ChannelType, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import { setTicketCategoryId } from "../services/tickets.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-config")
    .setDescription("Set the channel category where tickets are created.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("category")
        .setDescription("Category channel for new tickets")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;

    const category = interaction.options.getChannel("category", true);
    if (category.type !== ChannelType.GuildCategory) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "Invalid channel",
            body: "Please select a category channel.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    await setTicketCategoryId(guild, category.id);
    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "Ticket category set",
          body: `New tickets will be created under **${category.name}**.`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
