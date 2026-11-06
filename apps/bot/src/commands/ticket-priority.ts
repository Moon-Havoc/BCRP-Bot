import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { findTicketByChannel } from "../services/tickets.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-priority")
    .setDescription("Change the priority of a ticket.")
    .addStringOption((option) =>
      option
        .setName("priority")
        .setDescription("New priority level")
        .setRequired(true)
        .addChoices(
          { name: "Low", value: "low" },
          { name: "Medium", value: "medium" },
          { name: "High", value: "high" },
          { name: "Urgent", value: "urgent" },
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

    const newPriority = interaction.options.getString("priority", true);
    const priorityEmoji =
      { low: "🟢", medium: "🟡", high: "🟠", urgent: "🔴" }[newPriority] ?? "⚪";

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { priority: newPriority },
    });

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "Priority updated",
          body: `Ticket #${ticket.ticketNumber} priority changed to **${priorityEmoji} ${newPriority}**.`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
