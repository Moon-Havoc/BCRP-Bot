import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { prisma } from "@bcrp/database";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { formatDiscordTimestamp, requireGuildPermission } from "../services/moderation.js";
import type { BotCommand } from "../types.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("View recent moderation cases for a member.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addUserOption((option) =>
      option.setName("user").setDescription("Member to look up").setRequired(true),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageMessages,
      "Manage Messages",
    );
    if (!guild) return;

    const user = interaction.options.getUser("user", true);
    const cases = await prisma.moderationCase.findMany({
      where: { guildId: guild.id, targetDiscordId: user.id },
      orderBy: { caseNumber: "desc" },
      take: 10,
    });

    if (cases.length === 0) {
      await interaction.reply(
        toInteractionReply(
          createTextCard({
            title: "No cases",
            body: `**${user.tag}** has no moderation cases in this server.`,
          }),
          { ephemeral: true },
        ),
      );
      return;
    }

    const lines = cases.map((moderationCase) => {
      const reason = moderationCase.reason ? ` — ${moderationCase.reason}` : "";
      return `**#${moderationCase.caseNumber}** ${moderationCase.type} · ${formatDiscordTimestamp(moderationCase.createdAt)}${reason}`;
    });

    await interaction.reply(
      toInteractionReply(
        createTextCard({
          title: `Cases for ${user.tag}`,
          body: lines.join("\n"),
        }),
        { ephemeral: true },
      ),
    );
  },
};

export default command;
