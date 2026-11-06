import { describe, expect, it } from "vitest";
import { getSafePublicConfig, loadBotConfig } from "./index.js";

describe("configuration validation", () => {
  it("requires bot startup credentials and parses a valid configuration", () => {
    expect(() => loadBotConfig({})).toThrow();
    expect(
      loadBotConfig({
        DISCORD_TOKEN: "local-test-token",
        DISCORD_APPLICATION_ID: "12345678901234567",
      }),
    ).toMatchObject({ DISCORD_TOKEN: "local-test-token" });
  });

  it("only returns explicitly public dashboard configuration", () => {
    expect(
      getSafePublicConfig({
        DASHBOARD_URL: "https://dashboard.example.test",
        API_AUTH_SECRET: "a-secret-that-must-not-be-returned",
      }),
    ).toEqual({ DASHBOARD_URL: "https://dashboard.example.test" });
  });
});
