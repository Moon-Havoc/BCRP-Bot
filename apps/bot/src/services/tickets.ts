import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type TextChannel,
  type User,
} from "discord.js";
import { prisma } from "@bcrp/database";
import { AuditAction } from "@bcrp/shared";
import { ensureGuild } from "./moderation.js";

export const TICKET_BUTTON_IDS = {
  open: "bcrp:ticket:open",
  claim: "bcrp:ticket:claim",
  close: "bcrp:ticket:close",
} as const;

const OPEN_TICKET_STATUSES = ["OPEN", "CLAIMED"] as const;

export async function getTicketCategoryId(guildId: string): Promise<string | null> {
  const settings = await prisma.guildSettings.findUnique({
    where: { guildId },
    select: { settings: true },
  });
  const categoryId = (settings?.settings as Record<string, unknown> | undefined)?.ticketCategoryId;
  return typeof categoryId === "string" ? categoryId : null;
}

export async function setTicketCategoryId(guild: Guild, categoryChannelId: string): Promise<void> {
  await ensureGuild(guild);
  const existing = await prisma.guildSettings.findUnique({
    where: { guildId: guild.id },
    select: { settings: true },
  });
  const settings = {
    ...((existing?.settings as Record<string, unknown>) ?? {}),
    ticketCategoryId: categoryChannelId,
  };
  await prisma.guildSettings.upsert({
    where: { guildId: guild.id },
    update: { settings },
    create: { guildId: guild.id, settings },
  });
}

export type OpenTicketResult =
  | { ok: true; ticketId: string; ticketNumber: number; channel: TextChannel }
  | { ok: false; reason: "not_configured" | "already_open"; ticketNumber?: number };

/**
 * Creates the private ticket channel and its database record. Discord side
 * effects run before the DB write; a failure leaves an orphan channel that an
 * operator can delete manually.
 */
export async function openTicket(
  guild: Guild,
  opener: User,
  subject: string,
): Promise<OpenTicketResult> {
  const categoryId = await getTicketCategoryId(guild.id);
  if (!categoryId) return { ok: false, reason: "not_configured" };

  const existing = await prisma.ticket.findFirst({
    where: {
      guildId: guild.id,
      openerDiscordId: opener.id,
      status: { in: [...OPEN_TICKET_STATUSES] },
    },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  if (existing) {
    return { ok: false, reason: "already_open", ticketNumber: existing.ticketNumber };
  }

  const latest = await prisma.ticket.findFirst({
    where: { guildId: guild.id },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  const ticketNumber = (latest?.ticketNumber ?? 0) + 1;
  const title = subject.slice(0, 200);

  const channel = (await guild.channels.create({
    name: `ticket-${ticketNumber}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    topic: `Ticket #${ticketNumber} — ${title} (opened by ${opener.tag})`,
    permissionOverwrites: buildTicketOverwrites(guild, opener),
  })) as TextChannel;

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: {
        guildId: guild.id,
        ticketNumber,
        channelId: channel.id,
        openerDiscordId: opener.id,
        title,
        status: "OPEN",
      },
    });
    await tx.auditLog.create({
      data: {
        guildId: guild.id,
        actorDiscordId: opener.id,
        action: AuditAction.TicketAction,
        targetType: "ticket",
        targetId: String(ticketNumber),
        metadata: { ticketId: created.id, event: "opened", subject: title },
      },
    });
    return created;
  });

  return { ok: true, ticketId: ticket.id, ticketNumber, channel };
}

function buildTicketOverwrites(guild: Guild, opener: User) {
  const overwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: opener.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  // Staff access: any cached role carrying Manage Messages can view the ticket.
  for (const role of guild.roles.cache.values()) {
    if (role.id !== guild.id && role.permissions.has(PermissionFlagsBits.ManageMessages)) {
      overwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }
  }
  return overwrites;
}

export async function findTicketByChannel(channelId: string) {
  return prisma.ticket.findFirst({ where: { channelId } });
}

export async function recordTicketEvent(params: {
  guildId: string;
  ticketId: string;
  actorDiscordId: string;
  event: "claimed" | "closed";
  assignedDiscordId?: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (params.event === "claimed") {
      await tx.ticket.update({
        where: { id: params.ticketId },
        data: {
          status: "CLAIMED",
          ...(params.assignedDiscordId !== undefined
            ? { assignedDiscordId: params.assignedDiscordId }
            : {}),
        },
      });
    } else {
      await tx.ticket.update({
        where: { id: params.ticketId },
        data: { status: "CLOSED", closedAt: new Date() },
      });
    }
    await tx.auditLog.create({
      data: {
        guildId: params.guildId,
        actorDiscordId: params.actorDiscordId,
        action: AuditAction.TicketAction,
        targetType: "ticket",
        targetId: params.ticketId,
        metadata: { event: params.event },
      },
    });
  });
}
