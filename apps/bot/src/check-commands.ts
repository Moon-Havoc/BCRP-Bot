import { loadCommands } from "./handlers/command-loader.js";

const commands = await loadCommands();
for (const command of commands.values()) console.log(command.data.toJSON());
console.info(`Loaded ${commands.size} slash command(s) without connecting to Discord.`);
