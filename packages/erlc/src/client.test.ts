import { describe, expect, it } from "vitest";
import { ErlcClient } from "./index.js";

const serverInfo = {
  Name: "BCRP local test",
  OwnerId: 123,
  CoOwnerIds: [],
  CurrentPlayers: 0,
  MaxPlayers: 40,
  JoinKey: "PRIVATE",
  AccVerifiedReq: "Email",
  TeamBalance: true,
};

describe("ER:LC API client", () => {
  it("calls only the documented server information route with optional documented query flags", async () => {
    let requestedUrl: RequestInfo | URL | undefined;
    let requestedInit: RequestInit | undefined;
    const fetchImplementation: typeof fetch = async (input, init) => {
      requestedUrl = input;
      requestedInit = init;
      return new Response(JSON.stringify(serverInfo), { status: 200 });
    };
    const client = new ErlcClient({ apiKey: "test-key", fetchImplementation });
    await expect(client.fetchServerInformation({ Players: true })).resolves.toMatchObject(
      serverInfo,
    );
    expect(String(requestedUrl)).toBe("https://api.erlc.gg/v2/server?Players=true");
    expect(new Headers(requestedInit?.headers).get("server-key")).toBe("test-key");
  });

  it("returns a structured rate limit error without retrying speculatively", async () => {
    const client = new ErlcClient({
      apiKey: "test-key",
      fetchImplementation: async () =>
        new Response("{}", { status: 429, headers: { "retry-after": "2" } }),
    });
    await expect(client.fetchServerInformation()).rejects.toMatchObject({
      code: "RATE_LIMITED",
      details: { retryAfterMs: 2000 },
    });
  });
});
