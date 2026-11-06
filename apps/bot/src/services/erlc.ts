import { createErlcClient, ErlcApiError, type ErlcServerInfo } from "@bcrp/erlc";

export interface ErlcStatusResult {
  ok: boolean;
  info?: ErlcServerInfo;
  error?: string;
}

export async function fetchServerStatus(): Promise<ErlcStatusResult> {
  try {
    const client = createErlcClient();
    const info = await client.fetchServerInformation({
      Players: true,
      Staff: true,
      Queue: true,
    });
    return { ok: true, info };
  } catch (error) {
    if (error instanceof ErlcApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Unknown error fetching ER:LC status." };
  }
}
