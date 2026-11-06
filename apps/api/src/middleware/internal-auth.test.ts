import { describe, expect, it } from "vitest";
import { isValidInternalSecret } from "./internal-auth.js";

describe("internal API authentication", () => {
  it("compares configured secrets without throwing on absent or different-length values", () => {
    const secret = "a-long-development-secret-value-32chars";
    expect(isValidInternalSecret(undefined, secret)).toBe(false);
    expect(isValidInternalSecret("short", secret)).toBe(false);
    expect(isValidInternalSecret(`${secret}longer`, secret)).toBe(false);
    expect(isValidInternalSecret(secret, secret)).toBe(true);
  });
});
