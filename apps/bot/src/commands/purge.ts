import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages from a channel.")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addUserOption((option) =>
      option.setName("user").setDescription("Only delete messages from this user"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.channel) return;

    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger("amount", true);
    const targetUser = interaction.options.getUser("user");

    if (!interaction.channel.isTextBased()) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "This command can only be used in text channels.",
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    try {
      let deleted = 0;

      if (targetUser) {
        // Delete messages from specific user
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter((m) => m.author.id === targetUser.id).first(amount);

        if (userMessages.length === 0) {
          await interaction.followUp(
            toInteractionReply(
              createTextCard({
                title: "No messages found",
                body: `No recent messages from ${targetUser.tag} to delete.`,
              }),
              { ephemeral: true },
            ),
          );
          return;
        }

        await interaction.channel.bulkDelete(userMessages, true);
        deleted = userMessages.length;
      } else {
        // Delete any messages
        const deletedMessages = await interaction.channel.bulkDelete(amount, true);
        deleted = deletedMessages.size;
      }

      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Messages purged",
            body: `Deleted **${deleted}** message(s)${targetUser ? ` from ${targetUser.tag}` : ""}.`,
          }),
          { ephemeral: true },
        ),
      );
    } catch {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "Error",
            body: "Failed to delete messages. Messages older than 14 days cannot be bulk deleted.",
          }),
          { ephemeral: true },
        ),
      );
    }
  },
};

export default command;
