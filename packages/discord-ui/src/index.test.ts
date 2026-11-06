import { describe, expect, it } from "vitest";
import { MessageFlags } from "discord.js";
import { createTextCard, toInteractionReply } from "./index.js";

describe("Components V2 message helpers", () => {
  it("builds a component-driven container and sets IS_COMPONENTS_V2", () => {
    const message = createTextCard({ title: "Status", body: "Ready" });
    const reply = toInteractionReply(message);

    expect(reply.flags).toBe(MessageFlags.IsComponentsV2);
    expect(message.container.toJSON()).toMatchObject({
      type: 17,
      components: [{ type: 10, content: "## Status\nReady" }],
    });
  });

  it("keeps ephemeral replies within Components V2", () => {
    const reply = toInteractionReply(createTextCard({ title: "Status", body: "Private" }), {
      ephemeral: true,
    });
    expect(reply.flags).toBe(MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral);
  });
});
