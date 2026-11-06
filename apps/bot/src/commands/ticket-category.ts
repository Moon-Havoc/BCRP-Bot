import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import {
  findTicketByChannel,
  TICKET_CATEGORIES,
  type TicketCategory,
} from "../services/tickets.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-category")
    .setDescription("Change the category of a ticket.")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("New ticket category")
        .setRequired(true)
        .addChoices(
          { name: "General Support", value: "general" },
          { name: "Internal Affairs Support", value: "internal" },
          { name: "Management Support", value: "management" },
          { name: "Leadership Support", value: "leadership" },
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.channel) return;

    await interaction.deferReply({ ephemeral: true });

    const ticket = await findTicketByChannel(interaction.channel.id);
    if (!ticket) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Not a ticket",
            body: "This command can only be used inside a ticket channel.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const newCategory = interaction.options.getString("category", true) as TicketCategory;
    const categoryName = TICKET_CATEGORIES[newCategory];

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { category: newCategory },
    });

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "Category updated",
          body: `Ticket #${ticket.ticketNumber} category changed to **${categoryName}**.`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
