import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildSafeRoute } from "./planner.js";

const cases = JSON.parse(
  readFileSync(resolve(process.cwd(), "../tests/fixtures/route_cases.json"), "utf8"),
);

describe("safe route planner", () => {
  for (const testCase of cases) {
    it(testCase.name, () => {
      const result = buildSafeRoute(testCase);

      expect(result.commands).toEqual(testCase.expected_commands);
      expect(result.remaining_reachable).toBe(testCase.expected_remaining);
      expect(result.total_reachable).toBe(testCase.expected_total);
    });
  }
});
