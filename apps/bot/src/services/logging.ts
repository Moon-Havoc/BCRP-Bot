import { MessageFlags, type Guild } from "discord.js";
import { prisma, type Prisma } from "@bcrp/database";
import { createTextCard } from "@bcrp/discord-ui";
import { ensureGuild } from "./moderation.js";

export interface LogConfig {
  messageLogChannelId?: string;
  memberLogChannelId?: string;
  modLogChannelId?: string;
  automodLogChannelId?: string;
}

export async function getLogConfig(guildId: string): Promise<LogConfig> {
  const settings = await prisma.guildSettings.findUnique({
    where: { guildId },
    select: { settings: true },
  });
  const raw = (settings?.settings ?? {}) as Record<string, unknown>;
  const config: LogConfig = {};
  if (typeof raw.messageLogChannelId === "string") {
    config.messageLogChannelId = raw.messageLogChannelId;
  }
  if (typeof raw.memberLogChannelId === "string") {
    config.memberLogChannelId = raw.memberLogChannelId;
  }
  if (typeof raw.modLogChannelId === "string") {
    config.modLogChannelId = raw.modLogChannelId;
  }
  if (typeof raw.automodLogChannelId === "string") {
    config.automodLogChannelId = raw.automodLogChannelId;
  }
  return config;
}

export async function updateLogConfig(
  guild: Guild,
  patch: Partial<LogConfig>,
  clear = false,
): Promise<void> {
  await ensureGuild(guild);
  const existing = await prisma.guildSettings.findUnique({
    where: { guildId: guild.id },
    select: { settings: true },
  });
  const base = { ...((existing?.settings as Record<string, unknown>) ?? {}) };
  for (const key of [
    "messageLogChannelId",
    "memberLogChannelId",
    "modLogChannelId",
    "automodLogChannelId",
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

export function truncate(text: string, max = 400): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Sends a Components V2 log card to a configured channel. No-op if unset. */
export async function sendLogCard(
  guild: Guild,
  channelKind: keyof LogConfig,
  title: string,
  body: string,
): Promise<void> {
  const config = await getLogConfig(guild.id);
  const channelId = config[channelKind];
  if (!channelId) return;
  const channel = await guild.channels.fetch(channelId);
  if (!channel?.isTextBased() || !("send" in channel)) return;
  const card = createTextCard({ title, body });
  await channel.send({
    components: [card.container],
    flags: MessageFlags.IsComponentsV2,
  });
}
