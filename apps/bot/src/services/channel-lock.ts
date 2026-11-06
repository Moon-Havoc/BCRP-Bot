import {
  ChannelType,
  PermissionFlagsBits,
  type ForumChannel,
  type Guild,
  type GuildBasedChannel,
  type NewsChannel,
  type TextChannel,
} from "discord.js";
import { getWelcomeConfig } from "./welcome.js";

export interface LockResult {
  locked: string[];
  skipped: string[];
}

/**
 * Applies (or removes) channel overwrites so only the verified role and staff
 * can view the target channels. The verify and welcome channels are never
 * locked so new members can always reach them.
 */
export async function applyVerificationLock(
  guild: Guild,
  channelIds: string[],
  unlock: boolean,
): Promise<LockResult> {
  const me = guild.members.me;
  if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    throw new Error("BCRP needs the Manage Channels permission to lock channels.");
  }

  const config = await getWelcomeConfig(guild.id);
  const protectedIds = new Set(
    [config.verifyChannelId, config.welcomeChannelId].filter(
      (id): id is string => typeof id === "string",
    ),
  );

  const staffRoleIds = guild.roles.cache
    .filter((role) => role.permissions.has(PermissionFlagsBits.ManageMessages))
    .map((role) => role.id);

  const result: LockResult = { locked: [], skipped: [] };
  for (const channelId of channelIds) {
    if (protectedIds.has(channelId)) {
      result.skipped.push(channelId);
      continue;
    }
    const channel = guild.channels.cache.get(channelId);
    if (!channel || !isLockableChannel(channel)) {
      result.skipped.push(channelId);
      continue;
    }

    if (unlock) {
      await channel.permissionOverwrites.edit(guild.id, {
        ViewChannel: null,
      });
      for (const roleId of [config.verifiedRoleId, ...staffRoleIds]) {
        if (!roleId) continue;
        await channel.permissionOverwrites
          .edit(roleId, { ViewChannel: null })
          .catch(() => undefined);
      }
    } else {
      if (!config.verifiedRoleId) {
        throw new Error("No verified role configured. Run /welcome-config first.");
      }
      await channel.permissionOverwrites.edit(guild.id, {
        ViewChannel: false,
      });
      await channel.permissionOverwrites.edit(config.verifiedRoleId, {
        ViewChannel: true,
      });
      for (const roleId of staffRoleIds) {
        await channel.permissionOverwrites
          .edit(roleId, { ViewChannel: true })
          .catch(() => undefined);
      }
    }
    result.locked.push(channelId);
  }
  return result;
}

type LockableChannel = TextChannel | NewsChannel | ForumChannel;

function isLockableChannel(channel: GuildBasedChannel): channel is LockableChannel {
  return (
    channel.type === ChannelType.GuildText ||
    channel.type === ChannelType.GuildAnnouncement ||
    channel.type === ChannelType.GuildForum
  );
}

/** Resolves a category or single channel into lockable channel IDs. */
export function resolveLockTargets(
  guild: Guild,
  categoryId: string | null,
  channelId: string | null,
): string[] {
  if (categoryId) {
    const category = guild.channels.cache.get(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) return [];
    return [...category.children.cache.values()]
      .filter(isLockableChannel)
      .map((channel) => channel.id);
  }
  return channelId ? [channelId] : [];
}
