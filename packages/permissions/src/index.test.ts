import { describe, expect, it } from "vitest";
import { createEmptyPermissionContext, hasPermission } from "./index.js";

describe("permission evaluation", () => {
  it("requires a granted scoped permission", () => {
    const context = createEmptyPermissionContext("12345678901234567");
    expect(hasPermission(context, { allOf: ["dashboard.settings.read"] })).toBe(false);
    expect(
      hasPermission(
        { ...context, dashboardPermissions: ["dashboard.settings.read"] },
        { allOf: ["dashboard.settings.read"] },
      ),
    ).toBe(true);
  });

  it("checks Discord permissions as well as application permissions", () => {
    const context = {
      ...createEmptyPermissionContext("12345678901234567"),
      guildPermissions: ["guild.moderation.ban"] as const,
    };
    expect(
      hasPermission(context, {
        allOf: ["guild.moderation.ban"],
        discordAllOf: ["BanMembers"],
      }),
    ).toBe(false);
  });

  it("honors Discord Administrator when a Discord permission is required", () => {
    const context = {
      ...createEmptyPermissionContext("12345678901234567"),
      discordPermissions: ["Administrator"],
    };
    expect(hasPermission(context, { discordAllOf: ["BanMembers"] })).toBe(true);
  });
});
