import type { ButtonInteraction } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { getWelcomeConfig, recordVerification, VERIFY_BUTTON_PREFIX } from "../services/welcome.js";
import type { ComponentHandler } from "../handlers/component-router.js";

function ephemeralCard(title: string, body: string) {
  return toInteractionReply(createTextCard({ title, body }), { ephemeral: true });
}

async function handleVerify(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply(ephemeralCard("Server only", "Verification only works in the server."));
    return;
  }

  const targetUserId = interaction.customId.slice(VERIFY_BUTTON_PREFIX.length);
  if (interaction.user.id !== targetUserId) {
    await interaction.reply(
      ephemeralCard("Not your button", "This verification button belongs to another member."),
    );
    return;
  }

  const config = await getWelcomeConfig(interaction.guild.id);
  if (!config.verifiedRoleId) {
    await interaction.reply(
      ephemeralCard("Not configured", "Verification is not configured for this server."),
    );
    return;
  }

  const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
  if (!member) {
    await interaction.reply(
      ephemeralCard("Member not found", "Could not find your membership in this server."),
    );
    return;
  }
  if (member.roles.cache.has(config.verifiedRoleId)) {
    await interaction.reply(ephemeralCard("Already verified", "You already have access."));
    return;
  }

  await member.roles.add(config.verifiedRoleId, "BCRP verification");
  await recordVerification(interaction.guild.id, targetUserId);
  await interaction.reply(ephemeralCard("Verified", "You have been verified. Welcome aboard!"));
}

export function verificationComponentHandlers(): Map<string, ComponentHandler> {
  return new Map<string, ComponentHandler>([[VERIFY_BUTTON_PREFIX, handleVerify]]);
}
