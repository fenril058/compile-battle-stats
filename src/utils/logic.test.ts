import { describe, expect, it } from "vitest";
import { PROTOCOL_SETS, RATIO_SETS } from "../config";
import type { Match, Trio } from "../types";
import {
  fitStrengthModel,
  isRatioBattle,
  makeStats,
  matchup,
  matchupPairs,
  pairSynergy,
  parseMatchCsvRow,
  percent,
  quadrantPoints,
  ratioSum,
  rows,
  wilsonInterval,
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
      expect(result[0]).toMatchObject({ n: "WATER", g: 4, w: 3, l: 1, p: 75 });
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

    it("includes numeric low and high Wilson CI fields in each row", () => {
      const stats = {
        FIRE: { g: 10, w: 5 }, // p = 50
        WATER: { g: 4, w: 3 }, // p = 75
        METAL: { g: 2, w: 0 }, // p = 0
      };

      const result = rows(stats, "single", 5, 3);

      for (const row of result) {
        expect(typeof row.low).toBe("number");
        expect(typeof row.high).toBe("number");
      }
    });

    it("satisfies low <= p <= high for rows with g > 0", () => {
      const stats = {
        FIRE: { g: 10, w: 5 }, // p = 50
        WATER: { g: 4, w: 3 }, // p = 75
        METAL: { g: 2, w: 0 }, // p = 0
      };

      const result = rows(stats, "single", 5, 3);

      for (const row of result) {
        if (row.g > 0) {
          expect(row.low).toBeLessThanOrEqual(row.p);
          expect(row.p).toBeLessThanOrEqual(row.high);
        }
      }
    });
  });

  describe("quadrantPoints", () => {
    it("returns [] when single is empty (Σg = 0)", () => {
      expect(quadrantPoints({})).toEqual([]);
    });

    it("each point's p equals percent(w, g)", () => {
      const single = {
        FIRE: { g: 10, w: 7 },
        WATER: { g: 6, w: 3 },
        METAL: { g: 4, w: 2 },
      };
      const pts = quadrantPoints(single);
      for (const pt of pts) {
        const entry = single[pt.n as keyof typeof single];
        expect(pt.p).toBe(percent(entry.w, entry.g));
      }
    });

    it("pickRate sum ≈ 100 when minGames = 1 and no point is filtered", () => {
      const single = {
        FIRE: { g: 10, w: 7 },
        WATER: { g: 6, w: 3 },
        METAL: { g: 4, w: 2 },
      };
      const pts = quadrantPoints(single, 1);
      const total = pts.reduce((acc, pt) => acc + pt.pickRate, 0);
      expect(total).toBeGreaterThanOrEqual(99.5);
      expect(total).toBeLessThanOrEqual(100.5);
    });

    it("excludes points with g < minGames", () => {
      const single = {
        FIRE: { g: 5, w: 3 },
        WATER: { g: 2, w: 1 }, // g=2 < minGames=3 → 除外
        METAL: { g: 3, w: 2 },
      };
      const pts = quadrantPoints(single, 3);
      expect(pts.map((p) => p.n)).not.toContain("WATER");
      expect(pts).toHaveLength(2);
    });

    it("sorts by pickRate desc, then p desc on tie", () => {
      // totalG = 4 + 4 + 2 = 10
      // pickRate: A=40, B=40, C=20
      // A.p = 75, B.p = 50 → A before B
      const single = {
        A: { g: 4, w: 3 }, // pickRate = 40, p = 75
        B: { g: 4, w: 2 }, // pickRate = 40, p = 50
        C: { g: 2, w: 1 }, // pickRate = 20, p = 50
      };
      const pts = quadrantPoints(single);
      expect(pts[0].n).toBe("A");
      expect(pts[1].n).toBe("B");
      expect(pts[2].n).toBe("C");
    });
  });

  describe("wilsonInterval", () => {
    it("returns {p:0, low:0, high:0} when g === 0", () => {
      expect(wilsonInterval(0, 0)).toEqual({ p: 0, low: 0, high: 0 });
    });

    it("returns smaller low bound for smaller sample size (w=2,g=2 < w=20,g=20)", () => {
      const ci_2_2 = wilsonInterval(2, 2);
      const ci_20_20 = wilsonInterval(20, 20);

      expect(ci_2_2.low).toBeLessThan(ci_20_20.low);
    });

    it("keeps high <= 100 for 100% win rate (w=g>0)", () => {
      const ci = wilsonInterval(5, 5);
      expect(ci.high).toBeLessThanOrEqual(100);
      expect(ci.low).toBeLessThan(100);
    });

    it("computes correct p, low < high bounds, and respects 0..100 clamp for w=8,g=10", () => {
      const ci = wilsonInterval(8, 10);
      expect(ci.p).toBe(80);
      expect(ci.low).toBeLessThan(ci.high);
      expect(ci.low).toBeGreaterThanOrEqual(0);
      expect(ci.high).toBeLessThanOrEqual(100);
    });
  });

  describe("fitStrengthModel", () => {
    let idSeq = 0;
    const mk = (
      first: Trio,
      second: Trio,
      winner: "FIRST" | "SECOND",
    ): Match => ({
      id: `m${idSeq++}`,
      first,
      second,
      winner,
      ratio: false,
      createdAt: 0,
    });

    const maxAbs = (theta: Record<string, number>): number =>
      Math.max(0, ...Object.values(theta).map((v) => Math.abs(v)));

    // A=FIRE が（相方を変えても）常に勝ち、F=SPIRIT が常に負ける合成データ。
    // 各プロトコルは先攻/後攻に均等に出るので β（先後）では説明できず、
    // 強さの差は θ に表れる。
    const aStrongest = (): Match[] => [
      mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
      mk(["LIFE", "SPEED", "SPIRIT"], ["FIRE", "WATER", "METAL"], "SECOND"),
      mk(["FIRE", "LIFE", "SPEED"], ["WATER", "METAL", "SPIRIT"], "FIRST"),
      mk(["WATER", "METAL", "SPIRIT"], ["FIRE", "LIFE", "SPEED"], "SECOND"),
    ];

    it("有効試合が無ければ空モデルを返す", () => {
      expect(fitStrengthModel([])).toEqual({
        theta: {},
        firstAdvantage: 0,
        games: 0,
        iterations: 0,
        converged: true,
      });
    });

    it("不正な試合（重複/長さ違い）は学習対象から除外する", () => {
      const matches = [
        mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
        // チーム内重複 → isValidTrio で除外
        mk(["FIRE", "FIRE", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
      ];
      expect(fitStrengthModel(matches).games).toBe(1);
    });

    it("先攻が常に勝つデータでは firstAdvantage > 0 になる", () => {
      // 同じ2デッキを先後入れ替え、どちらも先攻勝ち → θ は相殺し β だけが効く。
      const matches = [
        mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
        mk(["LIFE", "SPEED", "SPIRIT"], ["FIRE", "WATER", "METAL"], "FIRST"),
      ];
      const model = fitStrengthModel(matches);
      expect(model.firstAdvantage).toBeGreaterThan(0);
    });

    it("常勝プロトコルの θ が最大・常敗プロトコルの θ が最小になる", () => {
      const model = fitStrengthModel(aStrongest());
      const values = Object.values(model.theta);
      expect(model.theta.FIRE).toBe(Math.max(...values));
      expect(model.theta.SPIRIT).toBe(Math.min(...values));
      expect(model.theta.FIRE).toBeGreaterThan(0);
      expect(model.theta.SPIRIT).toBeLessThan(0);
      expect(model.converged).toBe(true);
    });

    it("先後・強さが対称なデータでは β≈0 かつ θ が小さく縮む", () => {
      // 同一カードでも先攻勝ち/後攻勝ちが半々 → 五分。
      const matches = [
        mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
        mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "SECOND"),
      ];
      const model = fitStrengthModel(matches);
      expect(Math.abs(model.firstAdvantage)).toBeLessThan(0.05);
      expect(maxAbs(model.theta)).toBeLessThan(0.3);
      expect(model.converged).toBe(true);
    });

    it("L2 正則化を強めると θ の絶対値が縮む", () => {
      // 安定域（lr·λ < 2）の範囲で比較する。
      const weak = fitStrengthModel(aStrongest(), { lambda: 0.1 });
      const strong = fitStrengthModel(aStrongest(), { lambda: 1 });
      expect(maxAbs(strong.theta)).toBeLessThan(maxAbs(weak.theta));
    });
  });

  describe("pairSynergy", () => {
    let idSeq = 0;
    const mk = (
      first: Trio,
      second: Trio,
      winner: "FIRST" | "SECOND",
    ): Match => ({
      id: `s${idSeq++}`,
      first,
      second,
      winner,
      ratio: false,
      createdAt: 0,
    });

    // θ=0, β=0 のモデル。pred は常に σ(0)=0.5 → expected=50。
    const zeroModel = {
      theta: {
        FIRE: 0,
        WATER: 0,
        METAL: 0,
        LIFE: 0,
        SPEED: 0,
        SPIRIT: 0,
      },
      firstAdvantage: 0,
      games: 5,
      iterations: 1,
      converged: true,
    };

    it("model.games===0 なら空配列を返す", () => {
      const empty = { ...zeroModel, theta: {}, games: 0 };
      const matches = [
        mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
      ];
      expect(pairSynergy(matches, empty)).toEqual([]);
    });

    it("θ=0 モデルでは残差 = 実測勝率 − 50 になる", () => {
      // FIRE·WATER が常勝、LIFE·SPEED が常敗（5戦で minGames 到達）。
      const matches = Array.from({ length: 5 }, () =>
        mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
      );
      const res = pairSynergy(matches, zeroModel);

      const fw = res.find((r) => r.n === "FIRE · WATER");
      expect(fw).toMatchObject({
        g: 5,
        actual: 100,
        expected: 50,
        residual: 50,
      });

      const ls = res.find((r) => r.n === "LIFE · SPEED");
      expect(ls).toMatchObject({
        g: 5,
        actual: 0,
        expected: 50,
        residual: -50,
      });

      // 残差降順
      expect(res[0].residual).toBeGreaterThanOrEqual(
        res[res.length - 1].residual,
      );
    });

    it("minGames 未満のペアは除外する", () => {
      const matches = Array.from({ length: 3 }, () =>
        mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
      );
      // 既定 minGames=5 なので 3 戦では全除外
      expect(pairSynergy(matches, zeroModel)).toEqual([]);
      // minGames=3 にすれば現れる
      expect(pairSynergy(matches, zeroModel, 3).length).toBeGreaterThan(0);
    });

    it("強いプロトコルを含むペアは期待勝率が 50% より高くなる", () => {
      // FIRE が強い(θ=2)モデル。FIRE を含む常勝ペアの expected は σ(2)≈88% 付近。
      const model = { ...zeroModel, theta: { ...zeroModel.theta, FIRE: 2 } };
      const matches = Array.from({ length: 5 }, () =>
        mk(["FIRE", "WATER", "METAL"], ["LIFE", "SPEED", "SPIRIT"], "FIRST"),
      );
      const fw = pairSynergy(matches, model).find(
        (r) => r.n === "FIRE · WATER",
      );
      expect(fw).toBeDefined();
      expect((fw as { expected: number }).expected).toBeGreaterThan(50);
      // 実測100%のうち多くを FIRE の強さで説明 → 残差は θ=0 時(50)より小さい
      expect((fw as { residual: number }).residual).toBeLessThan(50);
    });
  });
});
