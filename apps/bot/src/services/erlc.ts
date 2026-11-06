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

export interface ErlcCommandResult {
  ok: boolean;
  message?: string;
  commandId?: string;
  error?: string;
}

export async function runErlcCommand(command: string): Promise<ErlcCommandResult> {
  try {
    const client = createErlcClient();
    const result = await client.runServerCommand(command);
    return { ok: true, message: result.message, commandId: result.commandId };
  } catch (error) {
    if (error instanceof ErlcApiError) {
      const retry =
        error.details.retryAfterMs !== undefined
          ? ` Try again in ${Math.ceil(error.details.retryAfterMs / 1000)}s.`
          : "";
      return { ok: false, error: `${error.message}${retry}` };
    }
    return { ok: false, error: "Unknown error running ER:LC command." };
  }
}
