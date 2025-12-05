import { describe, expect, it } from "vitest";
import { RATIO_SETS } from "../config";
import type { Match, Trio } from "../types";
import {
  isRatioBattle,
  makeStats,
  matchup,
  parseMatchCsvRow,
  ratioSum,
} from "./logic";

const MOCK_RATIOS = RATIO_SETS.V1;

describe("utils/logic", () => {
  describe("ratioSum & isRatioBattle", () => {
    const ratios = MOCK_RATIOS;

    it("calculates ratio sum correctly", () => {
      const trio: Trio = ["SPIRIT", "WATER", "HATE"];
      expect(ratioSum(trio, ratios)).toBe(1 + 3 + 5);
    });

    it("returns 0 for unknown protocols", () => {
      // biome-ignore lint/suspicious/noExplicitAny: テスト用に意図的に不正な型を渡すため
      const trio: Trio = ["UNKNOWN" as any, "FIRE", "WATER"];
      expect(ratioSum(trio, ratios)).toBe(0 + 5 + 3);
    });

    it("correctly identifies ratio battles based on maxRatio", () => {
      const teamA: Trio = ["FIRE", "WATER", "METAL"]; // sum: 15
      const teamB: Trio = ["LIFE", "SPIRIT", "SPEED"]; // sum: 4

      // 両方閾値以下ならTrue
      expect(isRatioBattle(teamA, teamB, ratios, 8)).toBe(true);
      // どちらかが超えていればFalse
      expect(isRatioBattle(teamA, teamB, ratios, 5)).toBe(false);
    });
  });

  describe("makeStats", () => {
    it("aggregates wins and games correctly", () => {
      const matches = [
        {
          id: "1",
          first: ["FIRE", "WATER", "HATE"],
          second: ["LIFE", "LIGHT", "DARKNESS"],
          winner: "FIRST",
        },
        {
          id: "2",
          first: ["FIRE", "WATER", "HATE"],
          second: ["LIFE", "LIGHT", "DARKNESS"],
          winner: "SECOND",
        },
      ] as Match[];

      const stats = makeStats(matches);

      // Single stats
      expect(stats.single.FIRE).toEqual({ g: 2, w: 1 }); // 1勝1敗
      expect(stats.single.LIFE).toEqual({ g: 2, w: 1 });

      // Pair stats (FIRE-WATER)
      expect(stats.pair["FIRE · WATER"]).toBeDefined();
      expect(stats.pair["FIRE · WATER"].g).toBe(2);
    });

    it("skips invalid matches (duplicate protocols in trio)", () => {
      const matches = [
        {
          id: "1",
          first: ["FIRE", "FIRE", "HATE"], // 重複あり（不正）
          second: ["LIFE", "LIGHT", "DARKNESS"],
          winner: "FIRST",
        },
        {
          id: "2",
          first: ["WATER", "HATE", "FIRE"], // 正常
          second: ["LIFE", "LIGHT", "DARKNESS"],
          winner: "FIRST",
        },
      ] as Match[];

      const stats = makeStats(matches);

      // 不正な試合はカウントされないため、LIFEの試合数は1になるはず
      expect(stats.single.LIFE.g).toBe(1);
    });
  });

  describe("matchup (Matrix)", () => {
    it("generates matchup data", () => {
      const matches = [
        {
          first: ["FIRE", "WATER", "HATE"],
          second: ["LIFE", "LIGHT", "DARKNESS"],
          winner: "FIRST",
        },
      ] as Match[];

      const matrix = matchup(matches);
      expect(matrix).toBeDefined();
    });
  });

  describe("parseMatchCsvRow", () => {
    const validProtocols = [
      "WATER",
      "SPEED",
      "PSYCHIC",
      "DARKNESS",
      "LIFE",
      "METAL",
    ] as const;
    const ratios = MOCK_RATIOS;

    it("parses a valid row correctly", () => {
      const row = [
        "WATER",
        "SPEED",
        "PSYCHIC",
        "DARKNESS",
        "LIFE",
        "METAL",
        "FIRST",
        "2025/01/01",
      ];
      const result = parseMatchCsvRow(row, validProtocols, ratios, 10);

      expect(result).not.toBeNull();
      expect(result?.first).toEqual(["WATER", "SPEED", "PSYCHIC"]);
      expect(result?.winner).toBe("FIRST");
      // 日付がタイムスタンプになっているか
      expect(result?.matchDate).toBe(new Date("2025/01/01").getTime());
    });

    it("returns null for invalid protocol", () => {
      const row = [
        "WATER",
        "SPEED",
        "INVALID",
        "DATE",
        "LEFE",
        "METAL",
        "FIRST",
        "",
      ];
      const result = parseMatchCsvRow(row, validProtocols, ratios, 10);
      expect(result).toBeNull();
    });

    it("handles empty date as null", () => {
      // Empty date
      const row = [
        "WATER",
        "SPEED",
        "PSYCHIC",
        "DARKNESS",
        "LIFE",
        "METAL",
        "FIRST",
        "SECOND",
        "",
      ];
      const result = parseMatchCsvRow(row, validProtocols, ratios, 10);
      expect(result?.matchDate).toBeNull();
    });
  });
});
