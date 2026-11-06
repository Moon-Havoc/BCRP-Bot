import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { findTicketByChannel } from "../services/tickets.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-assign")
    .setDescription("Assign a ticket to a specific staff member.")
    .addUserOption((option) =>
      option.setName("user").setDescription("Staff member to assign").setRequired(true),
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

    const targetUser = interaction.options.getUser("user", true);

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedDiscordId: targetUser.id,
        status: "CLAIMED",
      },
    });

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "Ticket assigned",
          body: `Ticket #${ticket.ticketNumber} assigned to **${targetUser.tag}**.`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
