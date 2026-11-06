import { GuildMember, type ChatInputCommandInteraction, type Guild } from "discord.js";
import { prisma, ModerationCaseType } from "@bcrp/database";
import { AuditAction } from "@bcrp/shared";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { sendLogCard } from "./logging.js";

export function formatDiscordTimestamp(date: Date): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

export async function ensureGuild(guild: Guild): Promise<void> {
  await prisma.guild.upsert({
    where: { id: guild.id },
    update: { name: guild.name, iconHash: guild.icon },
    create: { id: guild.id, name: guild.name, iconHash: guild.icon },
  });
}

/**
 * Verifies the interaction is in a guild and the member holds the required
 * Discord permission. Replies ephemerally and returns null on failure.
 */
export async function requireGuildPermission(
  interaction: ChatInputCommandInteraction,
  permission: bigint,
  permissionLabel: string,
): Promise<Guild | null> {
  const ephemeral = (title: string, body: string) =>
    interaction.reply(toInteractionReply(createTextCard({ title, body }), { ephemeral: true }));

  if (!interaction.inGuild() || !interaction.guild) {
    await ephemeral("Server only", "Moderation commands can only be used inside a Discord server.");
    return null;
  }
  if (!interaction.memberPermissions?.has(permission)) {
    await ephemeral(
      "Missing permission",
      `You need the **${permissionLabel}** permission to use this command.`,
    );
    return null;
  }
  await ensureGuild(interaction.guild);
  return interaction.guild;
}

export function requireGuildMember(interaction: ChatInputCommandInteraction): GuildMember | null {
  const member = interaction.options.getMember("user");
  return member instanceof GuildMember ? member : null;
}

export interface ModerationCaseInput {
  guildId: string;
  type: ModerationCaseType;
  targetDiscordId: string;
  actorDiscordId: string;
  reason?: string;
  expiresAt?: Date;
  guild?: Guild;
}

/**
 * Creates a ModerationCase row with the next per-guild case number and an
 * AuditLog entry in the same transaction.
 */
export async function recordModerationCase(input: ModerationCaseInput): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.moderationCase.findFirst({
      where: { guildId: input.guildId },
      orderBy: { caseNumber: "desc" },
      select: { caseNumber: true },
    });
    const caseNumber = (latest?.caseNumber ?? 0) + 1;

    await tx.moderationCase.create({
      data: {
        guildId: input.guildId,
        caseNumber,
        type: input.type,
        targetDiscordId: input.targetDiscordId,
        actorDiscordId: input.actorDiscordId,
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        guildId: input.guildId,
        actorDiscordId: input.actorDiscordId,
        action: AuditAction.ModerationAction,
        targetType: "moderation_case",
        targetId: String(caseNumber),
        metadata: {
          caseType: input.type,
          targetDiscordId: input.targetDiscordId,
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
        },
      },
    });

    // Send log card to mod log channel
    const guild = input.guild as Guild | undefined;
    if (guild) {
      const typeEmoji = {
        WARNING: "⚠️",
        NOTE: "📝",
        TIMEOUT: "⏱️",
        KICK: "👢",
        BAN: "🔨",
        UNBAN: "✅",
      }[input.type] ?? "📋";
      
      await sendLogCard(
        guild,
        "modLogChannelId",
        `${typeEmoji} ${input.type} — Case #${caseNumber}`,
        `**Target:** <@${input.targetDiscordId}>\n**Moderator:** <@${input.actorDiscordId}>\n**Reason:** ${input.reason ?? "No reason provided"}`,
      );
    }

    return caseNumber;
  });
}
