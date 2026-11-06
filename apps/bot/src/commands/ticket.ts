import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { openTicket, TICKET_CATEGORIES, TICKET_PRIORITIES } from "../services/tickets.js";
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
    )
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Ticket category")
        .addChoices(
          { name: "General Support", value: "general" },
          { name: "Internal Affairs Support", value: "internal" },
          { name: "Management Support", value: "management" },
          { name: "Leadership Support", value: "leadership" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("priority")
        .setDescription("Ticket priority")
        .addChoices(
          { name: "Low", value: "low" },
          { name: "Medium", value: "medium" },
          { name: "High", value: "high" },
          { name: "Urgent", value: "urgent" },
        ),
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
    const category = (interaction.options.getString("category") ??
      "general") as keyof typeof TICKET_CATEGORIES;
    const priority = (interaction.options.getString("priority") ??
      "medium") as keyof typeof TICKET_PRIORITIES;

    const result = await openTicket(
      interaction.guild,
      interaction.user,
      subject,
      category,
      priority,
    );
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

    const categoryName = TICKET_CATEGORIES[result.category];
    const priorityName = TICKET_PRIORITIES[result.priority];

    await result.channel.send({
      components: [buildTicketIntro(result.ticketNumber, categoryName, priorityName)],
      flags: MessageFlags.IsComponentsV2,
    });
    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: "Ticket opened",
          body: `Your **${categoryName}** ticket **#${result.ticketNumber}** (${priorityName}) is ready: <#${result.channel.id}>`,
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
