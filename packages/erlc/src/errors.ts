export type ErlcErrorCode =
  | "NOT_CONFIGURED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "RATE_LIMITED"
  | "HTTP_ERROR"
  | "API_ERROR"
  | "INVALID_RESPONSE";

export class ErlcApiError extends Error {
  constructor(
    public readonly code: ErlcErrorCode,
    message: string,
    public readonly details: { httpStatus?: number; apiCode?: number; retryAfterMs?: number } = {},
  ) {
    super(message);
    this.name = "ErlcApiError";
  }
}
