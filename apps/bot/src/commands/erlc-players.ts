import { SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { fetchServerStatus } from "../services/erlc.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("erlc-players")
    .setDescription("List players currently on the ER:LC server."),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const result = await fetchServerStatus();

    if (!result.ok || !result.info) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "ER:LC players unavailable",
            body: result.error ?? "Could not fetch player list.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const players = result.info.Players ?? [];
    if (players.length === 0) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "No players online",
            body: "The ER:LC server currently has no players.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const lines = players.map((p) => {
      const location = p.Location ? ` — ${p.Location.StreetName} ${p.Location.BuildingNumber}` : "";
      const callsign = p.Callsign ? ` (${p.Callsign})` : "";
      const wanted = p.WantedStars && p.WantedStars > 0 ? ` ⭐${p.WantedStars}` : "";
      return `• **${p.Player}**${callsign} — ${p.Team}${location}${wanted}`;
    });

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: `Players Online (${players.length})`,
          body: lines.join("\n"),
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
