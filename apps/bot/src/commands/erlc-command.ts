import {
  ContainerBuilder,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import { sendLogCard, truncate } from "../services/logging.js";
import { runErlcCommand } from "../services/erlc.js";
import {
  ERLC_COMMANDS,
  TIER_LABELS,
  TIER_PERMISSIONS,
  resolveErlcCommand,
  type ErlcCommandTier,
} from "../services/erlc-commands.js";
import type { BotCommand } from "../types.js";

const TIERS: { tier: ErlcCommandTier; discordPerm: string }[] = [
  { tier: "mod", discordPerm: "Manage Server" },
  { tier: "admin", discordPerm: "Administrator" },
  { tier: "coowner", discordPerm: "Administrator" },
];

function buildCommandListContainer(): ContainerBuilder {
  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("# ER:LC In-Game Commands"),
  );
  for (const { tier, discordPerm } of TIERS) {
    const rows = ERLC_COMMANDS.filter((command) => command.tier === tier)
      .map((command) => `\`${command.syntax}\` — ${command.description}`)
      .join("\n");
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${TIER_LABELS[tier]}** — requires ${discordPerm} in Discord\n${rows}`,
      ),
    );
  }
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      'Run one with `/erlc-command command:"<cmd>"` — e.g. `/erlc-command command:":h Server restarting in 5 minutes"`',
    ),
  );
  return container;
}

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("erlc-command")
    .setDescription("Run an in-game ER:LC command as virtual server management.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription('In-game command to run, e.g. ":h Server restarting in 5 minutes". Omit to list commands.')
        .setMaxLength(500),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;

    const commandText = interaction.options.getString("command");

    if (!commandText) {
      await interaction.reply({
        components: [buildCommandListContainer()],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const resolved = resolveErlcCommand(commandText);
    if (resolved?.info) {
      const required = TIER_PERMISSIONS[resolved.info.tier];
      if (!interaction.memberPermissions?.has(required)) {
        await interaction.followUp(
          toInteractionReply(
            createTextCard({
              title: "Insufficient permissions",
              body: `\`${resolved.info.syntax}\` requires **${TIER_LABELS[resolved.info.tier]}** in ER:LC, which maps to **${resolved.info.tier === "mod" ? "Manage Server" : "Administrator"}** in Discord.`,
            }),
            { ephemeral: true },
          ),
        );
        return;
      }
    }

    const result = await runErlcCommand(commandText);
    const tierNote = resolved?.info
      ? ` (${TIER_LABELS[resolved.info.tier]})`
      : " (unrecognized command — verify it exists in-game)";

    await sendLogCard(
      guild,
      "modLogChannelId",
      result.ok ? "ER:LC Command Executed" : "ER:LC Command Failed",
      `**By:** ${interaction.user.tag}\n**Command:** \`${truncate(commandText)}\`${tierNote}\n**Result:** ${result.ok ? (result.message ?? "Success") : (result.error ?? "Failed")}`,
    ).catch(() => {});

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: result.ok ? "ER:LC Command Sent" : "ER:LC Command Failed",
          body: result.ok
            ? `**Command:** \`${truncate(commandText)}\`\n**Result:** ${result.message ?? "Success"}`
            : `**Command:** \`${truncate(commandText)}\`\n**Error:** ${result.error ?? "Unknown error"}`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
