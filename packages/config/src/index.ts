import { z } from "zod";

const optionalUrl = z.string().url().optional();
const optionalId = z
  .string()
  .regex(/^\d{17,20}$/)
  .optional();

const commonSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().url().optional(),
  DISCORD_TOKEN: z.string().min(1).optional(),
  DISCORD_APPLICATION_ID: optionalId,
  DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
  DISCORD_DEV_GUILD_ID: optionalId,
  ERLC_API_KEY: z.string().min(1).optional(),
  ERLC_API_BASE_URL: z.string().url().default("https://api.erlc.gg"),
  ERLC_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  API_AUTH_SECRET: z.string().min(32).optional(),
  DASHBOARD_URL: optionalUrl,
  API_URL: optionalUrl,
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  BOT_HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(4001),
});

export type RuntimeConfig = z.infer<typeof commonSchema>;
export type BotConfig = RuntimeConfig & { DISCORD_TOKEN: string; DISCORD_APPLICATION_ID: string };
export type ApiConfig = RuntimeConfig & { API_AUTH_SECRET: string };

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return commonSchema.parse(env);
}

export function loadBotConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  return commonSchema
    .extend({
      DISCORD_TOKEN: z.string().min(1),
      DISCORD_APPLICATION_ID: z.string().regex(/^\d{17,20}$/),
    })
    .parse(env);
}

export function loadCommandRegistrationConfig(env: NodeJS.ProcessEnv = process.env) {
  return commonSchema
    .extend({
      DISCORD_TOKEN: z.string().min(1),
      DISCORD_APPLICATION_ID: z.string().regex(/^\d{17,20}$/),
      DISCORD_DEV_GUILD_ID: optionalId,
    })
    .parse(env);
}

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return commonSchema.extend({ API_AUTH_SECRET: z.string().min(32) }).parse(env);
}

export function loadDashboardServerConfig(env: NodeJS.ProcessEnv = process.env) {
  return commonSchema
    .extend({ DASHBOARD_URL: z.string().url(), API_URL: z.string().url() })
    .parse(env);
}

export function getSafePublicConfig(env: NodeJS.ProcessEnv = process.env) {
  return z
    .object({ DASHBOARD_URL: z.string().url().optional() })
    .parse({ DASHBOARD_URL: env.DASHBOARD_URL });
}
