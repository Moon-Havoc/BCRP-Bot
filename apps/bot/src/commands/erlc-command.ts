import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import { sendLogCard, truncate } from "../services/logging.js";
import { runErlcCommand } from "../services/erlc.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("erlc-command")
    .setDescription("Run an in-game ER:LC command as virtual server management.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription('In-game command to run, e.g. ":h Server restarting in 5 minutes"')
        .setRequired(true)
        .setMaxLength(500),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;

    const commandText = interaction.options.getString("command", true);
    await interaction.deferReply({ ephemeral: true });

    const result = await runErlcCommand(commandText);

    await sendLogCard(
      guild,
      "modLogChannelId",
      result.ok ? "ER:LC Command Executed" : "ER:LC Command Failed",
      `**By:** ${interaction.user.tag}\n**Command:** \`${truncate(commandText)}\`\n**Result:** ${result.ok ? (result.message ?? "Success") : (result.error ?? "Failed")}`,
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
