import { describe, expect, it } from "vitest";
import { PROTOCOL_SETS, RATIO_SETS } from "../config";
import type { Match, Trio } from "../types";
import {
  isRatioBattle,
  makeStats,
  matchup,
  matchupPairs,
  parseMatchCsvRow,
  percent,
  ratioSum,
  rows,
} from "./logic";

const MOCK_RATIOS = RATIO_SETS.S1;

describe("utils/logic", () => {
  describe("ratioSum & isRatioBattle", () => {
    const ratios = MOCK_RATIOS;
    const allV1 = PROTOCOL_SETS.V1;

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
      const teamA: Trio = ["FIRE", "WATER", "METAL"]; // sum: 8
      const teamB: Trio = ["LIFE", "SPIRIT", "SPEED"]; // sum: 4

      // 両方閾値以下ならTrue
      expect(isRatioBattle(teamA, teamB, ratios, 8, allV1)).toBe(true);
      // どちらかが超えていればFalse
      expect(isRatioBattle(teamA, teamB, ratios, 5, allV1)).toBe(false);
    });

    it("returns false when a trio contains a non-eligible protocol", () => {
      const v1AuxOnly = PROTOCOL_SETS.V1_AUX;
      // biome-ignore lint/suspicious/noExplicitAny: テスト用に意図的にV2プロトコルを使用
      const teamWithV2: Trio = ["LUCK" as any, "FIRE", "WATER"];
      const teamB: Trio = ["LIFE", "SPIRIT", "SPEED"];

      expect(isRatioBattle(teamWithV2, teamB, ratios, 8, v1AuxOnly)).toBe(
        false,
      );
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

    it("excludes intra-team-duplicate matches, consistent with makeStats (#67)", () => {
      // チーム内重複（FIRE が2枚）のある不正な試合だけを与える。
      // makeStats と同様に統計対象外なので、相性表のセルは埋まらない（null のまま）。
      const invalid = {
        first: ["FIRE", "FIRE", "HATE"],
        second: ["LIFE", "LIGHT", "DARKNESS"],
        winner: "FIRST",
      } as Match;

      const matrix = matchup([invalid, invalid, invalid]);
      expect(matrix.FIRE?.LIFE).toBeNull();
    });
  });

  describe("matchupPairs (Matrix alt view)", () => {
    const make = (winner: "FIRST" | "SECOND"): Match =>
      ({
        first: ["FIRE", "WATER", "HATE"],
        second: ["LIFE", "LIGHT", "DARKNESS"],
        winner,
      }) as Match;

    it("excludes pairs below MIN_GAMES_FOR_MATRIX", () => {
      // 2 戦だけなら、どの有向ペアも g=2 < 3 なので空配列
      expect(matchupPairs([make("FIRST"), make("FIRST")])).toEqual([]);
    });

    it("returns directed pairs at/over the threshold, sorted by games then win-rate", () => {
      const pairs = matchupPairs([make("FIRST"), make("FIRST"), make("FIRST")]);

      // 3x3 のクロス積 × 双方向 = 18 ペア、いずれも g=3
      expect(pairs).toHaveLength(18);
      expect(pairs.every((p) => p.g === 3)).toBe(true);

      expect(pairs.find((p) => p.a === "FIRE" && p.b === "LIFE")).toMatchObject(
        { g: 3, w: 3, l: 0, p: 100 },
      );
      expect(pairs.find((p) => p.a === "LIFE" && p.b === "FIRE")).toMatchObject(
        { g: 3, w: 0, l: 3, p: 0 },
      );

      // 戦数が同一なので勝率降順: 先頭 100, 末尾 0
      expect(pairs[0].p).toBe(100);
      expect(pairs[pairs.length - 1].p).toBe(0);
    });

    it("ignores intra-team-duplicate matches when counting (#67)", () => {
      // 有効な3戦 + 不正な3戦（先攻に FIRE が2枚）。
      // 不正な試合は集計されないので、FIRE→LIFE の戦数は有効分の 3 のまま
      // （もし不正な試合も数えていたら FIRE が2枚ぶん二重計上され 9 になる）。
      const invalid = {
        first: ["FIRE", "FIRE", "HATE"],
        second: ["LIFE", "LIGHT", "DARKNESS"],
        winner: "FIRST",
      } as Match;

      const pairs = matchupPairs([
        make("FIRST"),
        make("FIRST"),
        make("FIRST"),
        invalid,
        invalid,
        invalid,
      ]);

      const fireLife = pairs.find((p) => p.a === "FIRE" && p.b === "LIFE");
      expect(fireLife?.g).toBe(3);
    });

    it("returns empty when every match is intra-team-duplicate (#67)", () => {
      const invalid = {
        first: ["FIRE", "FIRE", "HATE"],
        second: ["LIFE", "LIGHT", "DARKNESS"],
        winner: "FIRST",
      } as Match;

      expect(matchupPairs([invalid, invalid, invalid])).toEqual([]);
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
    const ratioProtocols = PROTOCOL_SETS.V1;

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
      const result = parseMatchCsvRow(
        row,
        validProtocols,
        ratios,
        10,
        ratioProtocols,
      );

      expect(result).not.toBeNull();
      expect(result?.first).toEqual(["WATER", "SPEED", "PSYCHIC"]);
      expect(result?.winner).toBe("FIRST");
      // 暦日として UTC 真夜中のタイムスタンプになっているか（#69）
      expect(result?.matchDate).toBe(Date.UTC(2025, 0, 1));
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
      const result = parseMatchCsvRow(
        row,
        validProtocols,
        ratios,
        10,
        ratioProtocols,
      );
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
      const result = parseMatchCsvRow(
        row,
        validProtocols,
        ratios,
        10,
        ratioProtocols,
      );
      expect(result?.matchDate).toBeNull();
    });

    it("returns null when the row has fewer than 7 columns", () => {
      const row = ["WATER", "SPEED", "PSYCHIC", "DARKNESS", "LIFE", "METAL"];
      expect(
        parseMatchCsvRow(row, validProtocols, ratios, 10, ratioProtocols),
      ).toBeNull();
    });

    it("returns null for an invalid winner value", () => {
      const row = [
        "WATER",
        "SPEED",
        "PSYCHIC",
        "DARKNESS",
        "LIFE",
        "METAL",
        "DRAW", // FIRST/SECOND 以外
        "",
      ];
      expect(
        parseMatchCsvRow(row, validProtocols, ratios, 10, ratioProtocols),
      ).toBeNull();
    });
  });

  describe("percent", () => {
    it("returns 0 when there are no games (avoids divide-by-zero)", () => {
      expect(percent(0, 0)).toBe(0);
      expect(percent(5, 0)).toBe(0);
    });

    it("rounds to one decimal place", () => {
      expect(percent(1, 2)).toBe(50);
      expect(percent(1, 3)).toBe(33.3);
      expect(percent(2, 3)).toBe(66.7);
    });
  });

  describe("rows", () => {
    it("computes losses/percent and sorts by win rate desc (no filter for single)", () => {
      const stats = {
        FIRE: { g: 10, w: 5 }, // p = 50
        WATER: { g: 4, w: 3 }, // p = 75
        METAL: { g: 2, w: 0 }, // p = 0
      };

      const result = rows(stats, "single", 5, 3);

      expect(result.map((r) => r.n)).toEqual(["WATER", "FIRE", "METAL"]);
      expect(result[0]).toEqual({ n: "WATER", g: 4, w: 3, l: 1, p: 75 });
    });

    it("filters out pairs below minPair", () => {
      const stats = {
        "A · B": { g: 6, w: 3 }, // 残る (>= 5)
        "C · D": { g: 4, w: 2 }, // 除外 (< 5)
      };

      const result = rows(stats, "pair", 5, 3);

      expect(result).toHaveLength(1);
      expect(result[0].n).toBe("A · B");
    });

    it("filters out trios below minTrio", () => {
      const stats = {
        "A · B · C": { g: 3, w: 1 }, // 残る (>= 3)
        "D · E · F": { g: 2, w: 2 }, // 除外 (< 3)
      };

      const result = rows(stats, "trio", 5, 3);

      expect(result).toHaveLength(1);
      expect(result[0].n).toBe("A · B · C");
    });
  });
});
