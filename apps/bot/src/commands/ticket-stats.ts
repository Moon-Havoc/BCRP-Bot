import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-stats")
    .setDescription("View ticket statistics for the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.inGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const [total, open, claimed, closed] = await Promise.all([
      prisma.ticket.count({ where: { guildId: interaction.guild!.id } }),
      prisma.ticket.count({ where: { guildId: interaction.guild!.id, status: "OPEN" } }),
      prisma.ticket.count({ where: { guildId: interaction.guild!.id, status: "CLAIMED" } }),
      prisma.ticket.count({ where: { guildId: interaction.guild!.id, status: "CLOSED" } }),
    ]);

    const byCategory = await prisma.ticket.groupBy({
      by: ["category"],
      where: { guildId: interaction.guild!.id },
      _count: true,
    });

    const byPriority = await prisma.ticket.groupBy({
      by: ["priority"],
      where: { guildId: interaction.guild!.id },
      _count: true,
    });

    let body = `**Total Tickets:** ${total}\n**Open:** ${open}\n**Claimed:** ${claimed}\n**Closed:** ${closed}\n\n`;

    if (byCategory.length > 0) {
      body += "**By Category:**\n";
      byCategory.forEach((c) => {
        body += `• ${c.category ?? "Uncategorized"}: ${c._count}\n`;
      });
      body += "\n";
    }

    if (byPriority.length > 0) {
      body += "**By Priority:**\n";
      const priorityEmoji = { low: "🟢", medium: "🟡", high: "🟠", urgent: "🔴" };
      byPriority.forEach((p) => {
        const emoji = priorityEmoji[p.priority as keyof typeof priorityEmoji] ?? "⚪";
        body += `• ${emoji} ${p.priority ?? "None"}: ${p._count}\n`;
      });
    }

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "Ticket Statistics",
          body,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
