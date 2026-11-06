import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("infractions")
    .setDescription("Show complete moderation history for a user.")
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
      },
      orderBy: { caseNumber: "desc" },
      take: 15,
    });

    if (cases.length === 0) {
      await interaction.followUp(
        toInteractionReply(
          createTextCard({
            title: "No infractions",
            body: `${targetUser.tag} has no moderation history.`,
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const lines = cases.map((c) => {
      const typeEmoji =
        {
          WARNING: "⚠️",
          NOTE: "📝",
          TIMEOUT: "⏱️",
          KICK: "👢",
          BAN: "🔨",
          UNBAN: "✅",
        }[c.type] ?? "📋";
      return `${typeEmoji} **Case #${c.caseNumber}** — ${c.type} — ${c.reason} (${c.createdAt.toLocaleDateString()})`;
    });

    await interaction.followUp(
      toInteractionReply(
        createTextCard({
          title: `Infractions for ${targetUser.tag}`,
          body: lines.join("\n"),
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
