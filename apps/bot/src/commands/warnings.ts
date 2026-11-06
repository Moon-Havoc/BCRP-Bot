import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("List all warnings for a user.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to check").setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.inGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("user", true);

    const cases = await prisma.moderationCase.findMany({
      where: {
        guildId: interaction.guild!.id,
        targetDiscordId: targetUser.id,
        type: "WARNING",
      },
      orderBy: { caseNumber: "desc" },
      take: 10,
    });

    if (cases.length === 0) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "No warnings",
            body: `${targetUser.tag} has no warnings.`,
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const lines = cases.map(
      (c) => `**Case #${c.caseNumber}** — ${c.reason} (${c.createdAt.toLocaleDateString()})`,
    );

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: `Warnings for ${targetUser.tag}`,
          body: lines.join("\n"),
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
