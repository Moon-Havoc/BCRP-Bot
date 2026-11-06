import {
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  type Client,
} from "discord.js";
import { loadRuntimeConfig } from "@bcrp/config";
import { createLogger } from "@bcrp/logger";
import { createErlcClient, type ErlcPlayer } from "@bcrp/erlc";
import { listErlcEventsTargets } from "./erlc-events.js";

const logger = createLogger("bot-erlc-monitor");
const MAX_EVENTS_PER_TICK = 20;

export interface PlayerDiff {
  joined: ErlcPlayer[];
  left: { name: string; player: ErlcPlayer }[];
}

/** Diffs the previous player snapshot against the latest one. */
export function diffPlayers(
  previous: ReadonlyMap<string, ErlcPlayer>,
  players: ErlcPlayer[],
): PlayerDiff {
  const current = new Map(players.map((player) => [player.Player, player]));
  const joined: ErlcPlayer[] = [];
  for (const player of players) {
    if (!previous.has(player.Player)) joined.push(player);
  }
  const left: { name: string; player: ErlcPlayer }[] = [];
  for (const [name, player] of previous) {
    if (!current.has(name)) left.push({ name, player });
  }
  return { joined, left };
}

function formatLocation(player: ErlcPlayer): string | undefined {
  const location = player.Location;
  if (!location) return undefined;
  const street = [location.BuildingNumber, location.StreetName]
    .filter((part) => typeof part === "string" && part.length > 0)
    .join(" ");
  return street || location.PostalCode || undefined;
}

function playerDetails(player: ErlcPlayer): string {
  const lines = [`**Player:** ${player.Player}`];
  if (player.Team) lines.push(`**Team:** ${player.Team}`);
  if (player.Callsign) lines.push(`**Callsign:** ${player.Callsign}`);
  const location = formatLocation(player);
  if (location) lines.push(`**Location:** ${location}`);
  if (player.WantedStars !== undefined && player.WantedStars > 0) {
    lines.push(`**Wanted:** ${"⭐".repeat(Math.min(player.WantedStars, 5))}`);
  }
  lines.push(`**Time:** ${new Date().toLocaleString()}`);
  return lines.join("\n");
}

function buildJoinCard(player: ErlcPlayer): ContainerBuilder {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# 🎮 Player Joined\n\n${playerDetails(player)}`),
  );
}

function buildLeaveCard(player: ErlcPlayer): ContainerBuilder {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# 👋 Player Left\n\n${playerDetails(player)}`),
  );
}

async function sendEventCards(
  client: Client,
  events: { joined: ErlcPlayer[]; left: { name: string; player: ErlcPlayer }[] },
): Promise<void> {
  const targets = await listErlcEventsTargets();
  if (targets.length === 0) return;

  const cards = [
    ...events.joined.map(buildJoinCard),
    ...events.left.map(({ player }) => buildLeaveCard(player)),
  ].slice(0, MAX_EVENTS_PER_TICK);
  if (cards.length === 0) return;

  for (const target of targets) {
    const guild = client.guilds.cache.get(target.guildId);
    if (!guild) continue;
    const channel = await guild.channels.fetch(target.channelId).catch(() => null);
    if (!channel?.isTextBased() || !("send" in channel)) continue;
    for (const card of cards) {
      await channel
        .send({ components: [card], flags: MessageFlags.IsComponentsV2 })
        .catch((error: unknown) =>
          logger.warn(
            { err: error, guildId: target.guildId, channelId: target.channelId },
            "Failed to send ER:LC event card",
          ),
        );
    }
  }
}

/**
 * Polls the ER:LC server-info endpoint and posts player join/leave events
 * to every guild that has ER:LC event logging enabled.
 */
export function startErlcMonitor(client: Client): void {
  const intervalSeconds = loadRuntimeConfig().ERLC_MONITOR_INTERVAL_SECONDS;
  let knownPlayers: Map<string, ErlcPlayer> | null = null;

  const poll = async () => {
    if (!client.isReady()) return;
    try {
      const erlc = createErlcClient();
      const info = await erlc.fetchServerInformation({ Players: true });
      const players = info.Players ?? [];

      if (knownPlayers === null) {
        // First successful poll is the baseline — don't spam joins for
        // everyone already in the server.
        knownPlayers = new Map(players.map((player) => [player.Player, player]));
        logger.info({ players: players.length }, "ER:LC monitor baseline established");
        return;
      }

      const diff = diffPlayers(knownPlayers, players);
      knownPlayers = new Map(players.map((player) => [player.Player, player]));

      if (diff.joined.length > 0 || diff.left.length > 0) {
        logger.info(
          { joined: diff.joined.length, left: diff.left.length },
          "ER:LC player diff detected",
        );
        await sendEventCards(client, diff);
      }
    } catch (error) {
      logger.warn({ err: error }, "ER:LC monitor poll failed");
    }
  };

  const timer = setInterval(() => void poll(), intervalSeconds * 1000);
  timer.unref();
  void poll();
  logger.info({ intervalSeconds }, "ER:LC monitor started");
}
