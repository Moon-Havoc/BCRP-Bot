import { describe, expect, it } from "vitest";
import type { ErlcPlayer } from "@bcrp/erlc";
import { diffPlayers } from "./erlc-monitor.js";

function player(name: string, team = "Civilian"): ErlcPlayer {
  return { Player: name, Team: team };
}

describe("diffPlayers", () => {
  it("detects joins and leaves", () => {
    const previous = new Map([
      ["Alice", player("Alice")],
      ["Bob", player("Bob", "Police")],
    ]);
    const current = [player("Alice"), player("Carol", "EMS")];

    const diff = diffPlayers(previous, current);

    expect(diff.joined.map((p) => p.Player)).toEqual(["Carol"]);
    expect(diff.left.map((l) => l.name)).toEqual(["Bob"]);
    expect(diff.left[0]?.player.Team).toBe("Police");
  });

  it("returns empty diff when roster is unchanged", () => {
    const previous = new Map([["Alice", player("Alice")]]);
    expect(diffPlayers(previous, [player("Alice")])).toEqual({
      joined: [],
      left: [],
    });
  });

  it("detects everyone joining an empty server", () => {
    const diff = diffPlayers(new Map(), [player("A"), player("B")]);
    expect(diff.joined).toHaveLength(2);
    expect(diff.left).toHaveLength(0);
  });

  it("detects everyone leaving", () => {
    const previous = new Map([
      ["A", player("A")],
      ["B", player("B")],
    ]);
    const diff = diffPlayers(previous, []);
    expect(diff.joined).toHaveLength(0);
    expect(diff.left.map((l) => l.name).sort()).toEqual(["A", "B"]);
  });
});
