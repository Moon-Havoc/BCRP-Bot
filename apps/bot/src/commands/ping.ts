import { SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether the BCRP bot is responding."),
  async execute(interaction) {
    const latency = Math.max(0, Date.now() - interaction.createdTimestamp);
    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: "BCRP is responding",
          body: `Interaction received in **${latency} ms**.`,
        }),
      ),
    );
  },
};

export default command;
