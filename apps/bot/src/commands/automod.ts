import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { createTextCard, toInteractionReply } from "@bcrp/discord-ui";
import { requireGuildPermission } from "../services/moderation.js";
import {
  AUTOMOD_RULE_LABELS,
  buildRuleOptions,
  findBcrpRule,
  listBcrpRules,
  recordAutomodChange,
  type AutomodRuleKey,
} from "../services/automod.js";
import type { BotCommand } from "../types.js";

const RULE_CHOICES = ["invites", "links", "spam", "mention_spam", "keywords"] as const;

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Manage BCRP auto-moderation rules (Discord native AutoMod).")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("What to do")
        .setRequired(true)
        .addChoices(
          { name: "Add rule", value: "add" },
          { name: "Remove rule", value: "remove" },
          { name: "List rules", value: "list" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("rule")
        .setDescription("Which protection to manage")
        .addChoices(...RULE_CHOICES.map((value) => ({ name: value, value }))),
    )
    .addStringOption((option) =>
      option
        .setName("keyword")
        .setDescription("Word/phrase to block (required for the keywords rule)")
        .setMaxLength(100),
    ),
  async execute(interaction) {
    const guild = await requireGuildPermission(
      interaction,
      PermissionsBitField.Flags.ManageGuild,
      "Manage Server",
    );
    if (!guild) return;

    const action = interaction.options.getString("action", true);
    const ruleKey = interaction.options.getString("rule") as AutomodRuleKey | null;
    const keyword = interaction.options.getString("keyword");

    const reply = (title: string, body: string) =>
      interaction.reply(toInteractionReply(createTextCard({ title, body }), { ephemeral: true }));

    if (action === "list") {
      const rules = await listBcrpRules(guild);
      const body =
        rules.length === 0
          ? "No BCRP auto-mod rules are active."
          : rules.map((rule) => `• ${rule.name}${rule.enabled ? "" : " (disabled)"}`).join("\n");
      await reply("AutoMod rules", body);
      return;
    }

    if (!ruleKey || !RULE_CHOICES.includes(ruleKey as (typeof RULE_CHOICES)[number])) {
      await reply("Missing rule", "Specify which rule to manage.");
      return;
    }

    if (action === "add") {
      const options = buildRuleOptions(ruleKey, keyword ?? undefined);
      if ("error" in options) {
        await reply("Cannot add rule", options.error);
        return;
      }
      const existing = await findBcrpRule(guild, ruleKey, keyword ?? undefined);
      if (existing) {
        await reply("Already exists", `Rule **${existing.name}** is already active.`);
        return;
      }
      const rule = await guild.autoModerationRules.create(options);
      await recordAutomodChange(guild, interaction.user.id, "added", rule.name);
      await reply("Rule added", `**${rule.name}** is now active.`);
      return;
    }

    if (action === "remove") {
      const existing = await findBcrpRule(guild, ruleKey, keyword ?? undefined);
      if (!existing) {
        await reply(
          "Not found",
          `No matching rule for **${AUTOMOD_RULE_LABELS[ruleKey]}**${ruleKey === "keywords" ? " with that keyword" : ""}.`,
        );
        return;
      }
      await existing.delete("Removed via /automod");
      await recordAutomodChange(guild, interaction.user.id, "removed", existing.name);
      await reply("Rule removed", `**${existing.name}** was deleted.`);
      return;
    }

    await reply("Unknown action", "Use add, remove, or list.");
  },
};

export default command;
