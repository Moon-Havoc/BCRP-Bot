import { SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { fetchServerStatus } from "../services/erlc.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("erlc-queue")
    .setDescription("Check the ER:LC server queue."),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const result = await fetchServerStatus();

    if (!result.ok || !result.info) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "ER:LC queue unavailable",
            body: result.error ?? "Could not fetch queue status.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const queue = result.info.Queue ?? [];
    if (queue.length === 0) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Queue is empty",
            body: "No players are currently waiting in the ER:LC queue.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const lines = queue.map((userId, index) => `#${index + 1} — <@${userId}>`);
    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: `Queue (${queue.length})`,
          body: lines.join("\n"),
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
