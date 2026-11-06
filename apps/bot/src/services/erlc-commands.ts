import { PermissionsBitField } from "discord.js";

export type ErlcCommandTier = "mod" | "admin" | "coowner";

export interface ErlcCommandInfo {
  /** Canonical in-game command word, without the leading colon. */
  name: string;
  aliases?: string[];
  syntax: string;
  description: string;
  tier: ErlcCommandTier;
}

/**
 * ER:LC in-game staff commands runnable via POST /v2/server/command.
 * Tiers reflect the game's permission model; Discord-side enforcement is
 * mapped in TIER_PERMISSIONS because the API executes as server management.
 */
export const ERLC_COMMANDS: ErlcCommandInfo[] = [
  // Mod tier
  { name: "kick", syntax: ":kick [player]", description: "Kick a player from the server", tier: "mod" },
  { name: "kill", aliases: ["down"], syntax: ":kill [player]", description: "Kill a player", tier: "mod" },
  { name: "h", syntax: ":h [text]", description: "Server-wide hint banner", tier: "mod" },
  { name: "m", syntax: ":m [text]", description: "Server-wide popup message", tier: "mod" },
  { name: "pm", syntax: ":pm [player] [text]", description: "Popup message to one player", tier: "mod" },
  { name: "heal", syntax: ":heal [player]", description: "Heal or revive a player", tier: "mod" },
  { name: "to", syntax: ":to [player]", description: "Teleport yourself to a player", tier: "mod" },
  { name: "tp", syntax: ":tp [player] [player]", description: "Teleport one player to another", tier: "mod" },
  { name: "bring", syntax: ":bring [player]", description: "Bring a player to you", tier: "mod" },
  { name: "view", syntax: ":view [player]", description: "Spectate a player", tier: "mod" },
  { name: "refresh", syntax: ":refresh [player]", description: "Reload a player's skin", tier: "mod" },
  { name: "time", syntax: ":time [0-23]", description: "Set the server time", tier: "mod" },
  { name: "pt", aliases: ["peacetime"], syntax: ":pt [seconds]", description: "Peacetime — no player damage", tier: "mod" },
  { name: "prty", aliases: ["priority"], syntax: ":prty [seconds]", description: "Priority timer", tier: "mod" },
  { name: "wanted", syntax: ":wanted [player]", description: "Give a player a wanted level", tier: "mod" },
  { name: "unwanted", syntax: ":unwanted [player]", description: "Clear a player's wanted level", tier: "mod" },
  { name: "jail", syntax: ":jail [player]", description: "Jail a player", tier: "mod" },
  { name: "startfire", syntax: ":startfire [type]", description: "Start a fire (building/brush/house)", tier: "mod" },
  { name: "stopfire", syntax: ":stopfire", description: "Stop the active fire", tier: "mod" },
  { name: "stopdumpsterfire", syntax: ":stopdumpsterfire", description: "Stop dumpster fires", tier: "mod" },
  { name: "helper", syntax: ":helper [player]", description: "Grant helper status", tier: "mod" },
  { name: "unhelper", syntax: ":unhelper [player]", description: "Remove helper status", tier: "mod" },
  { name: "logs", syntax: ":logs", description: "Show who used what commands", tier: "mod" },
  { name: "kl", aliases: ["killlogs"], syntax: ":kl", description: "Show the kill list", tier: "mod" },
  { name: "cmds", syntax: ":cmds", description: "List in-game commands", tier: "mod" },
  { name: "bans", syntax: ":bans", description: "View server bans", tier: "mod" },
  { name: "mods", syntax: ":mods", description: "View server moderators", tier: "mod" },
  { name: "admins", syntax: ":admins", description: "View server admins", tier: "mod" },
  { name: "helpers", syntax: ":helpers", description: "View server helpers", tier: "mod" },
  // Admin tier
  { name: "ban", syntax: ":ban [player]", description: "Ban a player from the server", tier: "admin" },
  { name: "unban", syntax: ":unban [player]", description: "Unban a player", tier: "admin" },
  { name: "weather", syntax: ":weather [type]", description: "Change the server weather", tier: "admin" },
  { name: "mod", syntax: ":mod [player]", description: "Grant moderator status", tier: "admin" },
  { name: "unmod", syntax: ":unmod [player]", description: "Remove moderator status", tier: "admin" },
  { name: "shutdown", syntax: ":shutdown", description: "Shut down the server", tier: "admin" },
  { name: "loadlayout", syntax: ":loadlayout [name]", description: "Load a saved layout", tier: "admin" },
  { name: "unloadlayout", syntax: ":unloadlayout", description: "Unload the active layout", tier: "admin" },
  // Co-owner tier
  { name: "admin", syntax: ":admin [player]", description: "Grant admin status", tier: "coowner" },
  { name: "unadmin", syntax: ":unadmin [player]", description: "Remove admin status", tier: "coowner" },
];

/** Discord permission required to run commands of each tier. */
export const TIER_PERMISSIONS: Record<ErlcCommandTier, bigint> = {
  mod: PermissionsBitField.Flags.ManageGuild,
  admin: PermissionsBitField.Flags.Administrator,
  coowner: PermissionsBitField.Flags.Administrator,
};

export const TIER_LABELS: Record<ErlcCommandTier, string> = {
  mod: "Mod+",
  admin: "Admin+",
  coowner: "Co-Owner",
};

export interface ResolvedErlcCommand {
  /** The command word as typed (no colon). */
  word: string;
  info: ErlcCommandInfo | undefined;
}

/** Extracts the leading `:command` word from free-form input. */
export function resolveErlcCommand(input: string): ResolvedErlcCommand | null {
  const match = /^:?([A-Za-z][A-Za-z0-9_-]*)/.exec(input.trim());
  if (!match) return null;
  const word = match[1]!.toLowerCase();
  const info = ERLC_COMMANDS.find(
    (command) => command.name === word || command.aliases?.includes(word),
  );
  return { word, info };
}
