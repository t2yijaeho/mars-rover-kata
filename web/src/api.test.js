import { afterEach, describe, expect, it, vi } from "vitest";

import { planMission } from "./api.js";
import { requestApiMission } from "./api-client.js";

const snapshot = {
  width: 2,
  height: 1,
  tiles: [["walkable", "walkable"]],
  rover: { x: 0, y: 0 },
  fuel: 10,
  max_fuel: 100,
  explored: [{ x: 0, y: 0 }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("autopilot adapter", () => {
  it("uses the browser planner without a network request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await planMission(snapshot);

    expect(response.commands).toEqual(["ArrowRight"]);
    expect(response.source).toBe("safety_fallback");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("validates API movement commands", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ commands: ["Teleport"] }),
      }),
    );

    await expect(requestApiMission(snapshot)).rejects.toThrow(
      "unsupported movement command",
    );
  });

  it("surfaces API error details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Mission payload rejected." }),
      }),
    );

    await expect(requestApiMission(snapshot)).rejects.toThrow(
      "Mission payload rejected.",
    );
  });
});
