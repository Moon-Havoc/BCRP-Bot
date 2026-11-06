import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  PermissionsBitField,
  TextDisplayBuilder,
  type ButtonInteraction,
  type TextChannel,
} from "discord.js";
import { createTextCard } from "@bcrp/discord-ui";
import {
  findTicketByChannel,
  openTicket,
  recordTicketEvent,
  TICKET_BUTTON_IDS,
} from "../services/tickets.js";
import { prisma } from "@bcrp/database";
import type { ComponentHandler } from "../handlers/component-router.js";

export function buildTicketPanel(): ContainerBuilder {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# ASSISTANCE\n\n## Beach Coast Roleplay Help Desk\n\nWelcome to Beach Coast Roleplay! Have a question? The Support Desk is where you may find an answer for that! Here is all of the choices you may open if you need assistance.\n\n### General Support\n• Questions\n• Concerns\n• Staff Support\n\n### Internal Affairs Support\n• Reporting a Staff Member/HR Member\n• Application Questions\n\n### Management Support\n• Partnerships\n• Staff Appeal\n• Prize claiming\n• Paid Advertisements\n\n### Leadership Support\n• SHR Reports\n• Development Problems/Questions",
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(TICKET_BUTTON_IDS.open)
          .setLabel("Select a category")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("bcrp:ticket:my")
          .setLabel("My Tickets")
          .setStyle(ButtonStyle.Secondary),
      ),
    );
}

export function buildTicketIntro(ticketNumber: number): ContainerBuilder {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ASSISTANCE\n\n## Ticket #${ticketNumber}\n\nPlease describe your issue below. A staff member will be with you shortly.`,
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(TICKET_BUTTON_IDS.claim)
          .setLabel("Claim")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(TICKET_BUTTON_IDS.close)
          .setLabel("Close Ticket")
          .setStyle(ButtonStyle.Danger),
      ),
    );
}

function v2Card(title: string, body: string, ephemeral = false) {
  const card = createTextCard({ title, body });
  return {
    components: [card.container],
    flags: ephemeral
      ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      : MessageFlags.IsComponentsV2,
  };
}

const ephemeralCard = (title: string, body: string) => v2Card(title, body, true);

async function handleOpen(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply(
      ephemeralCard("Server only", "Tickets can only be opened inside a server."),
    );
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const result = await openTicket(interaction.guild, interaction.user, "Support request");
  if (!result.ok) {
    const body =
      result.reason === "already_open"
        ? `You already have an open ticket (#${result.ticketNumber}).`
        : "Tickets are not configured yet. An admin needs to set a ticket category.";
    await interaction.followUp(ephemeralCard("Cannot open ticket", body));
    return;
  }

  await result.channel.send({
    components: [buildTicketIntro(result.ticketNumber)],
    flags: MessageFlags.IsComponentsV2,
  });
  await interaction.followUp(
    ephemeralCard(
      "Ticket opened",
      `Your ticket **#${result.ticketNumber}** is ready: <#${result.channel.id}>`,
    ),
  );
}

async function getTicketContext(interaction: ButtonInteraction) {
  if (!interaction.inGuild() || !interaction.channel?.isTextBased()) return null;
  const ticket = await findTicketByChannel(interaction.channel.id);
  if (!ticket) return null;
  return ticket;
}

async function handleClaim(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inGuild()) return;
  const ticket = await getTicketContext(interaction);
  if (!ticket) {
    await interaction.reply(
      ephemeralCard("Not a ticket", "This button only works inside a ticket channel."),
    );
    return;
  }
  if (ticket.status !== "OPEN") {
    await interaction.reply(
      ephemeralCard(
        "Already handled",
        `Ticket #${ticket.ticketNumber} is ${ticket.status.toLowerCase()}.`,
      ),
    );
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
    await interaction.reply(ephemeralCard("Missing permission", "Only staff can claim tickets."));
    return;
  }

  await recordTicketEvent({
    guildId: ticket.guildId,
    ticketId: ticket.id,
    actorDiscordId: interaction.user.id,
    event: "claimed",
    assignedDiscordId: interaction.user.id,
  });
  await interaction.reply(
    ephemeralCard("Ticket claimed", `You are now handling ticket #${ticket.ticketNumber}.`),
  );
}

async function handleClose(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inGuild()) return;
  const ticket = await getTicketContext(interaction);
  if (!ticket) {
    await interaction.reply(
      ephemeralCard("Not a ticket", "This button only works inside a ticket channel."),
    );
    return;
  }
  if (ticket.status === "CLOSED") {
    await interaction.reply(
      ephemeralCard("Already closed", `Ticket #${ticket.ticketNumber} is already closed.`),
    );
    return;
  }

  const isStaff = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages);
  const isOpener = interaction.user.id === ticket.openerDiscordId;
  if (!isStaff && !isOpener) {
    await interaction.reply(
      ephemeralCard("Missing permission", "Only the ticket opener or staff can close this ticket."),
    );
    return;
  }

  await recordTicketEvent({
    guildId: ticket.guildId,
    ticketId: ticket.id,
    actorDiscordId: interaction.user.id,
    event: "closed",
  });
  const channel = interaction.channel as TextChannel;
  await channel.send(
    v2Card(
      "Ticket closed",
      `Ticket #${ticket.ticketNumber} was closed by <@${interaction.user.id}>.`,
    ),
  );
  await interaction.reply(
    ephemeralCard("Ticket closed", `Ticket #${ticket.ticketNumber} has been closed.`),
  );
}

async function handleMyTickets(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply(
      v2Card("Server only", "Tickets can only be viewed inside a server.", true),
    );
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const tickets = await prisma.ticket.findMany({
    where: {
      guildId: interaction.guild.id,
      openerDiscordId: interaction.user.id,
      status: { in: ["OPEN", "CLAIMED"] },
    },
    orderBy: { ticketNumber: "desc" },
    take: 5,
  });

  if (tickets.length === 0) {
    await interaction.followUp(v2Card("My tickets", "You have no open tickets.", true));
    return;
  }

  const lines = tickets.map(
    (ticket) => `**#${ticket.ticketNumber}** — ${ticket.status} <#${ticket.channelId}>`,
  );
  await interaction.followUp(v2Card("My tickets", lines.join("\n"), true));
}

export function ticketComponentHandlers(): Map<string, ComponentHandler> {
  return new Map<string, ComponentHandler>([
    [TICKET_BUTTON_IDS.open, handleOpen],
    [TICKET_BUTTON_IDS.claim, handleClaim],
    [TICKET_BUTTON_IDS.close, handleClose],
    ["bcrp:ticket:my", handleMyTickets],
  ]);
}
