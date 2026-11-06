import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  type AutoModerationRule,
  type AutoModerationRuleCreateOptions,
  type Guild,
} from "discord.js";
import { prisma } from "@bcrp/database";
import { AuditAction } from "@bcrp/shared";
import { ensureGuild } from "./moderation.js";

export const AUTOMOD_NAME_PREFIX = "BCRP:";

export type AutomodRuleKey = "invites" | "links" | "spam" | "mention_spam" | "keywords";

const INVITE_PATTERNS = [
  String.raw`discord\.gg/[a-zA-Z0-9-]+`,
  String.raw`discord(?:app)?\.com/invite/[a-zA-Z0-9-]+`,
];
const LINK_PATTERN = String.raw`https?://\S+`;

export const AUTOMOD_RULE_LABELS: Record<AutomodRuleKey, string> = {
  invites: "Block Discord invites",
  links: "Block links",
  spam: "Block spam",
  mention_spam: "Block mention spam",
  keywords: "Blocked keywords",
};

export function buildRuleOptions(
  key: AutomodRuleKey,
  keyword?: string,
): AutoModerationRuleCreateOptions | { error: string } {
  const base = {
    name: `${AUTOMOD_NAME_PREFIX} ${AUTOMOD_RULE_LABELS[key]}`,
    eventType: AutoModerationRuleEventType.MessageSend,
    actions: [{ type: AutoModerationActionType.BlockMessage }] as const,
    enabled: true,
    reason: "Managed by BCRP",
  };

  switch (key) {
    case "invites":
      return {
        ...base,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: { regexPatterns: INVITE_PATTERNS },
      };
    case "links":
      return {
        ...base,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: { regexPatterns: [LINK_PATTERN] },
      };
    case "spam":
      return { ...base, triggerType: AutoModerationRuleTriggerType.Spam };
    case "mention_spam":
      return { ...base, triggerType: AutoModerationRuleTriggerType.MentionSpam };
    case "keywords": {
      const trimmed = keyword?.trim();
      if (!trimmed) return { error: "The keywords rule requires a keyword." };
      return {
        ...base,
        name: `${AUTOMOD_NAME_PREFIX} Keyword: ${trimmed}`,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: { keywordFilter: [trimmed] },
      };
    }
  }
}

export async function listBcrpRules(guild: Guild): Promise<AutoModerationRule[]> {
  const rules = await guild.autoModerationRules.fetch();
  return [...rules.values()].filter((rule) => rule.name.startsWith(AUTOMOD_NAME_PREFIX));
}

export async function findBcrpRule(
  guild: Guild,
  key: AutomodRuleKey,
  keyword?: string,
): Promise<AutoModerationRule | undefined> {
  const rules = await listBcrpRules(guild);
  if (key === "keywords") {
    const trimmed = keyword?.trim();
    return trimmed
      ? rules.find((rule) => rule.name === `${AUTOMOD_NAME_PREFIX} Keyword: ${trimmed}`)
      : undefined;
  }
  const name = `${AUTOMOD_NAME_PREFIX} ${AUTOMOD_RULE_LABELS[key]}`;
  return rules.find((rule) => rule.name === name);
}

export async function recordAutomodChange(
  guild: Guild,
  actorDiscordId: string,
  event: string,
  ruleName: string,
): Promise<void> {
  await ensureGuild(guild);
  await prisma.auditLog.create({
    data: {
      guildId: guild.id,
      actorDiscordId,
      action: AuditAction.ConfigurationChanged,
      targetType: "automod_rule",
      targetId: ruleName,
      metadata: { event },
    },
  });
}
