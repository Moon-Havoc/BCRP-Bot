import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { openTicket } from "../services/tickets.js";
import { buildTicketIntro } from "../components/tickets.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a support ticket.")
    .addStringOption((option) =>
      option
        .setName("subject")
        .setDescription("What do you need help with?")
        .setRequired(true)
        .setMaxLength(200),
    ),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "Server only",
            body: "Tickets can only be opened inside a server.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subject = interaction.options.getString("subject", true);
    const result = await openTicket(interaction.guild, interaction.user, subject);
    if (!result.ok) {
      const body =
        result.reason === "already_open"
          ? `You already have an open ticket (#${result.ticketNumber}).`
          : "Tickets are not configured yet. An admin needs to set a ticket category.";
      await interaction.followUp(
        toInteractionReply(createTextCard({ title: "Cannot open ticket", body }), {
          ephemeral: true,
        }),
      );
      return;
    }

    await result.channel.send({
      components: [buildTicketIntro(result.ticketNumber)],
      flags: MessageFlags.IsComponentsV2,
    });
    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "Ticket opened",
          body: `Your ticket **#${result.ticketNumber}** is ready: <#${result.channel.id}>`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
