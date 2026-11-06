import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  type GuildMember,
  type MessageCreateOptions,
} from "discord.js";
import { prisma, type Prisma } from "@bcrp/database";
import { AuditAction } from "@bcrp/shared";
import { ensureGuild } from "./moderation.js";
import type { Guild } from "discord.js";

export const VERIFY_BUTTON_PREFIX = "bcrp:verify:";

export interface WelcomeConfig {
  welcomeChannelId?: string;
  verifyChannelId?: string;
  verifiedRoleId?: string;
  rulesText?: string;
}

export async function getWelcomeConfig(guildId: string): Promise<WelcomeConfig> {
  const settings = await prisma.guildSettings.findUnique({
    where: { guildId },
    select: { settings: true },
  });
  const raw = (settings?.settings ?? {}) as Record<string, unknown>;
  const config: WelcomeConfig = {};
  if (typeof raw.welcomeChannelId === "string") config.welcomeChannelId = raw.welcomeChannelId;
  if (typeof raw.verifyChannelId === "string") config.verifyChannelId = raw.verifyChannelId;
  if (typeof raw.verifiedRoleId === "string") config.verifiedRoleId = raw.verifiedRoleId;
  if (typeof raw.rulesText === "string") config.rulesText = raw.rulesText;
  return config;
}

export async function updateWelcomeConfig(
  guild: Guild,
  patch: Partial<WelcomeConfig>,
  clear = false,
): Promise<void> {
  await ensureGuild(guild);
  const existing = await prisma.guildSettings.findUnique({
    where: { guildId: guild.id },
    select: { settings: true },
  });
  const base = { ...((existing?.settings as Record<string, unknown>) ?? {}) };
  for (const key of [
    "welcomeChannelId",
    "verifyChannelId",
    "verifiedRoleId",
    "rulesText",
  ] as const) {
    if (clear) delete base[key];
    else if (patch[key] !== undefined) base[key] = patch[key];
  }
  const settings = base as Prisma.InputJsonValue;
  await prisma.guildSettings.upsert({
    where: { guildId: guild.id },
    update: { settings },
    create: { guildId: guild.id, settings },
  });
}

export function buildWelcomeCard(member: GuildMember): ContainerBuilder {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `## Welcome to ${member.guild.name}, ${member}!\nWe're glad you're here. Please read the rules and verify to get full access.`,
    ),
  );
}

export function buildVerifyCard(userId: string, rulesText?: string): ContainerBuilder {
  const rules = rulesText ? `\n\n### Rules\n${rulesText}` : "";
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## Verification${rules}\n\n<@${userId}> click **Verify** to accept the rules and gain access.`,
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${VERIFY_BUTTON_PREFIX}${userId}`)
          .setLabel("Verify")
          .setStyle(ButtonStyle.Success),
      ),
    );
}

export async function sendVerifyPrompt(member: GuildMember, config: WelcomeConfig): Promise<void> {
  const container = buildVerifyCard(member.id, config.rulesText);
  const payload: MessageCreateOptions = {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { users: [member.id] },
  };

  try {
    const dm = await member.createDM();
    await dm.send(payload);
    return;
  } catch {
    // Member likely has DMs disabled; fall back to the configured channel.
  }

  if (config.verifyChannelId) {
    const channel = await member.guild.channels.fetch(config.verifyChannelId);
    if (channel?.isTextBased() && "send" in channel) {
      await channel.send(payload);
    }
  }
}

export async function recordVerification(guildId: string, userId: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      guildId,
      actorDiscordId: userId,
      action: AuditAction.ConfigurationChanged,
      targetType: "member_verification",
      targetId: userId,
      metadata: { event: "verified" },
    },
  });
}
