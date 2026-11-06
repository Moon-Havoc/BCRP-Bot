export * from "./validation.js";

export const BCRP_NAME = "Beach Coast Roleplay" as const;
export const BCRP_PRODUCT_NAME = "BCRP" as const;

export type EnvironmentName = "development" | "test" | "production";
export type ApiSuccess<T> = { ok: true; data: T; requestId: string };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string };
  requestId: string;
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export enum AuditAction {
  SystemStarted = "SYSTEM_STARTED",
  ConfigurationChanged = "CONFIGURATION_CHANGED",
  ModerationAction = "MODERATION_ACTION",
  TicketAction = "TICKET_ACTION",
}
