import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { Collection } from "discord.js";
import type { BotCommand } from "../types.js";

function resolveCommandsDirectory(): string {
  const candidates = [
    // Source layout: src/handlers/command-loader.ts -> src/commands
    path.dirname(fileURLToPath(import.meta.url)).replace(/handlers$/, "commands"),
    // Bundled layout on hosts: cwd/dist/commands
    path.resolve(process.cwd(), "dist/commands"),
    path.resolve(process.cwd(), "src/commands"),
  ];
  const commandsDir = candidates.find(
    (candidate) => path.basename(candidate) === "commands" && existsSync(candidate),
  );
  return commandsDir ?? candidates[0]!;
}

const commandsDirectory = resolveCommandsDirectory();

export async function loadCommands(
  directory = commandsDirectory,
): Promise<Collection<string, BotCommand>> {
  const files = (await readdir(directory)).filter((file) => /\.(ts|js)$/.test(file));
  const commands = new Collection<string, BotCommand>();

  for (const file of files.sort()) {
    const moduleUrl = pathToFileURL(path.join(directory, file)).href;
    const module = (await import(moduleUrl)) as { default?: BotCommand };
    const command = module.default;
    if (!command?.data || typeof command.execute !== "function") {
      throw new Error(`Command module ${file} must export a default BotCommand.`);
    }
    const name = command.data.name;
    if (commands.has(name)) throw new Error(`Duplicate slash command name: ${name}`);
    commands.set(name, command);
  }
  return commands;
}
