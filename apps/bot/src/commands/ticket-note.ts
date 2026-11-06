import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { findTicketByChannel } from "../services/tickets.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-note")
    .setDescription("Add an internal staff note to a ticket.")
    .addStringOption((option) =>
      option
        .setName("note")
        .setDescription("Internal note (staff only)")
        .setRequired(true)
        .setMaxLength(1000),
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

    const note = interaction.options.getString("note", true);

    // Store note in audit log
    await prisma.auditLog.create({
      data: {
        guildId: ticket.guildId,
        actorDiscordId: interaction.user.id,
        action: "TICKET_NOTE" as const,
        targetType: "ticket",
        targetId: ticket.id,
        metadata: {
          note,
          ticketNumber: ticket.ticketNumber,
        },
      },
    });

    // Send note to channel (staff only can see)
    await interaction.channel.send({
      content: `📝 **Staff Note** — <@${interaction.user.id}>: ${note}`,
    });

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "Note added",
          body: `Internal note added to ticket #${ticket.ticketNumber}.`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
