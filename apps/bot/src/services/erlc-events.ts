import { Guild } from "discord.js";
import { prisma, type Prisma } from "@bcrp/database";
import { ensureGuild } from "./moderation.js";

export interface ErlcEventsConfig {
  channelId: string | undefined;
  enabled: boolean;
}

export interface ErlcEventsTarget {
  guildId: string;
  channelId: string;
}

export async function getErlcEventsConfig(guildId: string): Promise<ErlcEventsConfig> {
  const settings = await prisma.guildSettings.findUnique({
    where: { guildId },
    select: { settings: true },
  });
  const raw = (settings?.settings ?? {}) as Record<string, unknown>;
  return {
    channelId: typeof raw.erlcEventsChannelId === "string" ? raw.erlcEventsChannelId : undefined,
    enabled: raw.erlcEventsEnabled === true,
  };
}

export async function updateErlcEventsConfig(
  guild: Guild,
  patch: { channelId?: string; enabled?: boolean },
): Promise<ErlcEventsConfig> {
  await ensureGuild(guild);
  const existing = await prisma.guildSettings.findUnique({
    where: { guildId: guild.id },
    select: { settings: true },
  });
  const base = { ...((existing?.settings as Record<string, unknown>) ?? {}) };
  if (patch.channelId !== undefined) base.erlcEventsChannelId = patch.channelId;
  if (patch.enabled !== undefined) base.erlcEventsEnabled = patch.enabled;
  const settings = base as Prisma.InputJsonValue;
  await prisma.guildSettings.upsert({
    where: { guildId: guild.id },
    update: { settings },
    create: { guildId: guild.id, settings },
  });
  return getErlcEventsConfig(guild.id);
}

/** All guilds that have ER:LC event logging enabled with a channel set. */
export async function listErlcEventsTargets(): Promise<ErlcEventsTarget[]> {
  const rows = await prisma.guildSettings.findMany({ select: { guildId: true, settings: true } });
  const targets: ErlcEventsTarget[] = [];
  for (const row of rows) {
    const raw = (row.settings ?? {}) as Record<string, unknown>;
    if (raw.erlcEventsEnabled === true && typeof raw.erlcEventsChannelId === "string") {
      targets.push({ guildId: row.guildId, channelId: raw.erlcEventsChannelId });
    }
  }
  return targets;
}
