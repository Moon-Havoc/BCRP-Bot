import {
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  type InteractionReplyOptions,
} from "discord.js";

/** A reusable message definition that is always sent as Discord Components V2. */
export interface ComponentsV2Message {
  container: ContainerBuilder;
  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
}

export interface TextCardOptions {
  title: string;
  body: string;
}

export function createTextCard({ title, body }: TextCardOptions): ComponentsV2Message {
  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## ${title}\n${body}`),
  );

  return { container, flags: MessageFlags.IsComponentsV2 };
}

export function toInteractionReply(
  message: ComponentsV2Message,
  options: { ephemeral?: boolean } = {},
): InteractionReplyOptions {
  return {
    components: [message.container],
    flags: options.ephemeral
      ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      : MessageFlags.IsComponentsV2,
  };
}
