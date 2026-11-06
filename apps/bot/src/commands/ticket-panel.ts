import { MessageFlags, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import { buildTicketPanel } from "../components/tickets.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Post the ticket panel with an 'Open a Ticket' button.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;
    if (!interaction.channel || !("send" in interaction.channel)) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "Unsupported channel",
            body: "Run this command in a text channel.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    await interaction.channel.send({
      components: [buildTicketPanel()],
      flags: MessageFlags.IsComponentsV2,
    });
    await interaction.reply(
      toInteractionReply(
        createTextCard({ title: "Panel posted", body: "Members can now open tickets here." }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
