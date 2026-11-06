import { describe, expect, it } from "vitest";
import { ERLC_COMMANDS, resolveErlcCommand } from "./erlc-commands.js";

describe("resolveErlcCommand", () => {
  it("resolves canonical commands with and without colon", () => {
    expect(resolveErlcCommand(":h hello")?.info?.name).toBe("h");
    expect(resolveErlcCommand("kick badguy")?.info?.name).toBe("kick");
    expect(resolveErlcCommand("  :Ban  Player1")?.info?.tier).toBe("admin");
  });

  it("resolves aliases to their canonical command", () => {
    expect(resolveErlcCommand(":down Steve")?.info?.name).toBe("kill");
    expect(resolveErlcCommand(":killlogs")?.info?.name).toBe("kl");
    expect(resolveErlcCommand(":priority 60")?.info?.name).toBe("prty");
  });

  it("returns info undefined for unknown commands", () => {
    const resolved = resolveErlcCommand(":fly Player1");
    expect(resolved?.word).toBe("fly");
    expect(resolved?.info).toBeUndefined();
  });

  it("returns null for input with no command word", () => {
    expect(resolveErlcCommand("!!!")).toBeNull();
    expect(resolveErlcCommand("")).toBeNull();
  });

  it("assigns correct tiers", () => {
    const byName = (name: string) => ERLC_COMMANDS.find((c) => c.name === name);
    expect(byName("kick")?.tier).toBe("mod");
    expect(byName("ban")?.tier).toBe("admin");
    expect(byName("admin")?.tier).toBe("coowner");
    expect(byName("shutdown")?.tier).toBe("admin");
  });
});
