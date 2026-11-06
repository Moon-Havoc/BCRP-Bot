import { describe, expect, it } from "vitest";
import { loadCommands } from "./command-loader.js";

describe("slash command loader", () => {
  it("loads the ping command without a Discord connection", async () => {
    const commands = await loadCommands();
    expect(commands.has("ping")).toBe(true);
    expect(commands.get("ping")?.data.toJSON().description).toContain("Check whether");
    for (const name of ["warn", "note", "timeout", "kick", "ban", "unban", "case"]) {
      expect(commands.has(name), `missing command: ${name}`).toBe(true);
    }
  });
});
