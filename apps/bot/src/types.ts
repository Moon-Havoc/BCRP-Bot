import type { ChatInputCommandInteraction, SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface BotCommand {
  data: SlashCommandOptionsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface BotEvent {
  name: string;
  once?: boolean;
  execute(...args: unknown[]): Promise<void> | void;
}
