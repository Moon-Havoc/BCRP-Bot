import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import type { Client } from "discord.js";
import { createLogger } from "@bcrp/logger";
import type { BotEvent } from "../types.js";

function resolveEventsDirectory(): string {
  const candidates = [
    // Source layout: src/handlers/event-loader.ts -> src/events
    path.dirname(fileURLToPath(import.meta.url)).replace(/handlers$/, "events"),
    // Bundled layout on hosts: cwd/dist/events
    path.resolve(process.cwd(), "dist/events"),
    path.resolve(process.cwd(), "src/events"),
  ];
  const eventsDir = candidates.find(
    (candidate) => path.basename(candidate) === "events" && existsSync(candidate),
  );
  return eventsDir ?? candidates[0]!;
}

const eventsDirectory = resolveEventsDirectory();
const logger = createLogger("bot-events");

export async function loadEvents(client: Client, directory = eventsDirectory): Promise<void> {
  const files = (await readdir(directory)).filter((file) => /\.(ts|js)$/.test(file));
  for (const file of files.sort()) {
    const moduleUrl = pathToFileURL(path.join(directory, file)).href;
    const module = (await import(moduleUrl)) as { default?: BotEvent };
    const event = module.default;
    if (!event || typeof event.name !== "string" || typeof event.execute !== "function") {
      throw new Error(`Event module ${file} must export a default BotEvent.`);
    }
    const handler = (...args: unknown[]) => {
      try {
        void Promise.resolve(event.execute(...args)).catch((error: unknown) => {
          logger.error({ err: error, eventName: event.name }, "Discord event handler failed");
        });
      } catch (error) {
        logger.error({ err: error, eventName: event.name }, "Discord event handler failed");
      }
    };
    if (event.once) client.once(event.name as never, handler as never);
    else client.on(event.name as never, handler as never);
  }
}
