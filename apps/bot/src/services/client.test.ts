import { describe, expect, it } from "vitest";
import { GatewayIntentBits } from "discord.js";
import { createBotClient } from "./client.js";

describe("bot client foundation", () => {
  it("initializes with the guild, member, message, moderation, and content intents", () => {
    const client = createBotClient();
    const expected =
      GatewayIntentBits.Guilds |
      GatewayIntentBits.GuildMembers |
      GatewayIntentBits.GuildMessages |
      GatewayIntentBits.GuildModeration |
      GatewayIntentBits.MessageContent;
    expect(client.options.intents.bitfield).toBe(expected);
    client.destroy();
  });
});
