import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { findTicketByChannel } from "../services/tickets.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-reopen")
    .setDescription("Reopen a closed ticket.")
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

    if (ticket.status !== "CLOSED") {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Already open",
            body: `Ticket #${ticket.ticketNumber} is already ${ticket.status.toLowerCase()}.`,
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "OPEN",
        closedAt: null,
      },
    });

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "Ticket reopened",
          body: `Ticket #${ticket.ticketNumber} has been reopened.`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
