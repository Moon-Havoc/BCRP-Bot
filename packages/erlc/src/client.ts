import { loadRuntimeConfig } from "@bcrp/config";
import { z } from "zod";
import { ErlcApiError } from "./errors.js";
import {
  erlcServerCommandResponseSchema,
  erlcServerInfoSchema,
  serverInfoOptionsSchema,
  type ServerInfoOptions,
} from "./types.js";

const apiErrorSchema = z
  .object({
    error: z.string().optional(),
    message: z.string().optional(),
    code: z.number().optional(),
  })
  .passthrough();

export interface ErlcClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
}

export class ErlcClient {
  private readonly apiKey: string;
  private readonly baseUrl: URL;
  private readonly timeoutMs: number;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: ErlcClientOptions) {
    if (!options.apiKey.trim()) {
      throw new ErlcApiError("NOT_CONFIGURED", "ER:LC API key is not configured.");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = new URL(options.baseUrl ?? "https://api.erlc.gg");
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): ErlcClient {
    const config = loadRuntimeConfig(env);
    if (!config.ERLC_API_KEY) {
      throw new ErlcApiError("NOT_CONFIGURED", "ER:LC_API_KEY is not set.");
    }
    return new ErlcClient({
      apiKey: config.ERLC_API_KEY,
      baseUrl: config.ERLC_API_BASE_URL,
      timeoutMs: config.ERLC_REQUEST_TIMEOUT_MS,
    });
  }

  private async request(
    method: "GET" | "POST",
    path: string,
    body?: string,
  ): Promise<{ status: number; body: unknown }> {
    const url = new URL(path, this.baseUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImplementation(url, {
        method,
        headers: {
          "server-key": this.apiKey,
          accept: "application/json",
          ...(body !== undefined ? { "content-type": "application/json" } : {}),
        },
        ...(body !== undefined ? { body } : {}),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ErlcApiError("TIMEOUT", "ER:LC API request timed out.");
      }
      throw new ErlcApiError("NETWORK_ERROR", "Could not reach the ER:LC API.");
    } finally {
      clearTimeout(timeout);
    }

    const responseBody: unknown = await response.json().catch(() => undefined);
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const retryAfterMs = retryAfter ? Math.max(0, Number(retryAfter) * 1000) : undefined;
      throw new ErlcApiError("RATE_LIMITED", "ER:LC API rate limit was reached.", {
        httpStatus: 429,
        ...(retryAfterMs !== undefined && Number.isFinite(retryAfterMs) ? { retryAfterMs } : {}),
      });
    }

    if (!response.ok) {
      const apiError = apiErrorSchema.safeParse(responseBody);
      if (apiError.success && apiError.data.code !== undefined) {
        throw new ErlcApiError(
          "API_ERROR",
          apiError.data.message ?? apiError.data.error ?? "ER:LC API returned an error.",
          { httpStatus: response.status, apiCode: apiError.data.code },
        );
      }
      const message =
        apiError.success && typeof apiError.data.message === "string"
          ? apiError.data.message
          : undefined;
      throw new ErlcApiError(
        message ? "API_ERROR" : "HTTP_ERROR",
        message ?? "ER:LC API request failed.",
        { httpStatus: response.status },
      );
    }

    return { status: response.status, body: responseBody };
  }

  async fetchServerInformation(options: ServerInfoOptions = {}) {
    const validatedOptions = serverInfoOptionsSchema.parse(options);
    const url = new URL("/v2/server", this.baseUrl);
    for (const [key, enabled] of Object.entries(validatedOptions)) {
      if (enabled) url.searchParams.set(key, "true");
    }

    const { body } = await this.request("GET", `${url.pathname}${url.search}`);
    const parsed = erlcServerInfoSchema.safeParse(body);
    if (!parsed.success) {
      throw new ErlcApiError(
        "INVALID_RESPONSE",
        "ER:LC API returned an unexpected server response.",
      );
    }
    return parsed.data;
  }

  /** Runs an in-game command as virtual server management. */
  async runServerCommand(command: string) {
    const trimmed = command.trim();
    if (!trimmed) {
      throw new ErlcApiError("INVALID_RESPONSE", "Command cannot be empty.");
    }
    const { body } = await this.request("POST", "/v2/server/command", JSON.stringify({ command: trimmed }));
    const parsed = erlcServerCommandResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new ErlcApiError(
        "INVALID_RESPONSE",
        "ER:LC API returned an unexpected command response.",
      );
    }
    return parsed.data;
  }
}

export function createErlcClient(env: NodeJS.ProcessEnv = process.env): ErlcClient {
  return ErlcClient.fromEnvironment(env);
}
