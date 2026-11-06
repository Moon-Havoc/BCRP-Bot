import pino from "pino";
import { loadRuntimeConfig } from "@bcrp/config";

export function createLogger(service: string) {
  const config = loadRuntimeConfig();
  return pino({
    name: service,
    level: config.LOG_LEVEL,
    redact: {
      paths: ["*.token", "*.secret", "*.authorization", "*.cookie", "*.apiKey", "*.serverKey"],
      censor: "[REDACTED]",
    },
    base: { service, environment: config.NODE_ENV },
  });
}

export type BcrpLogger = ReturnType<typeof createLogger>;
