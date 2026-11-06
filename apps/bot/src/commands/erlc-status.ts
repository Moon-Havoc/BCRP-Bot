import { SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { fetchServerStatus } from "../services/erlc.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("erlc-status")
    .setDescription("Check ER:LC server status and player count."),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const result = await fetchServerStatus();

    if (!result.ok || !result.info) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "ER:LC status unavailable",
            body: result.error ?? "Could not fetch server status.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const info = result.info;
    const players = info.Players ?? [];
    const staff = info.Staff;
    const queue = info.Queue ?? [];

    let body = `**Server:** ${info.Name}\n**Players:** ${info.CurrentPlayers}/${info.MaxPlayers}\n**Queue:** ${queue.length} waiting`;

    if (players.length > 0) {
      body += `\n\n**Online Players (${players.length}):**\n`;
      body += players
        .slice(0, 10)
        .map((p) => `• ${p.Player}${p.Callsign ? ` (${p.Callsign})` : ""} — ${p.Team}`)
        .join("\n");
      if (players.length > 10) body += `\n... and ${players.length - 10} more`;
    }

    if (staff) {
      const staffLines: string[] = [];
      if (staff.Admins) staffLines.push(`Admins: ${Object.keys(staff.Admins).length}`);
      if (staff.Mods) staffLines.push(`Mods: ${Object.keys(staff.Mods).length}`);
      if (staff.Helpers) staffLines.push(`Helpers: ${Object.keys(staff.Helpers).length}`);
      if (staffLines.length > 0) body += `\n\n**Staff:** ${staffLines.join(", ")}`;
    }

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "ER:LC Server Status",
          body,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
