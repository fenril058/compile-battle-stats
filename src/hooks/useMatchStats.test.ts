import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PROTOCOL_SETS } from "../config";
import type { Match, Protocol } from "../types";
import { useMatchStats } from "./useMatchStats";

const testProtocols = PROTOCOL_SETS.V1_AUX as unknown as readonly Protocol[];

describe("useMatchStats", () => {
  // テスト用データ生成ヘルパー
  const createMatch = (
    id: string,
    matchDate: number | null,
    createdAt: number,
    ratio: boolean,
  ): Match =>
    ({
      id,
      matchDate,
      createdAt,
      ratio,
      first: ["APATHY", "DARKNESS", "GRAVITY"],
      second: ["HATE", "LIFE", "METAL"],
      winner: "FIRST",
      userId: "test",
    }) as Match;

  it("sorts matches by matchDate desc, then createdAt desc", () => {
    const matches = [
      createMatch("1", null, 100, false), // Dateなし、古い作成
      createMatch("2", null, 200, false), // Dateなし、新しい作成 (Should be 2nd)
      createMatch("3", 5000, 100, false), // Dateあり(古い) (Should be 4th)
      createMatch("4", 9000, 100, false), // Dateあり(新しい) (Should be 1st)
    ];

    const { result } = renderHook(() => useMatchStats(matches, testProtocols));

    const sortedIds = result.current.sortedMatches.map((m) => m.id);
    expect(sortedIds).toEqual(["4", "3", "2", "1"]);
  });

  it("separates normal and ratio stats", () => {
    const matches = [
      createMatch("1", 100, 100, false), // Normal
      createMatch("2", 100, 100, true), // Ratio
      createMatch("3", 100, 100, false), // Normal
    ];

    const { result } = renderHook(() => useMatchStats(matches, testProtocols));

    // 全体
    expect(result.current.statViews.all.all.single.APATHY.g).toBe(3);
    // Normalのみ
    expect(result.current.statViews.all.normal.single.APATHY.g).toBe(2);
    // Ratioのみ
    expect(result.current.statViews.all.ratio.single.APATHY.g).toBe(1);
  });

  it("reduces the all-matches matrix to protocols that actually appear", () => {
    const v2Protocols = PROTOCOL_SETS.V2 as unknown as readonly Protocol[];
    // 全体相性表は全試合が対象。ここでは FIRE/WATER/HATE × LUCK/WAR/COURAGE の
    // 6 プロトコルだけが登場し、3 戦で各有向ペアが MIN_GAMES(3) に到達する。
    const match = (id: string): Match =>
      ({
        id,
        matchDate: 100,
        createdAt: 100,
        ratio: false,
        first: ["FIRE", "WATER", "HATE"],
        // V2 専用プロトコルは Protocol 型(=V1_AUX)に含まれないため unknown 経由でキャスト
        second: ["LUCK", "WAR", "COURAGE"],
        winner: "FIRST",
        userId: "test",
      }) as unknown as Match;

    const matches = [match("1"), match("2"), match("3")];
    const { result } = renderHook(() => useMatchStats(matches, v2Protocols));

    const allView = result.current.matrixViews.all;
    // 縮約: 出現した 6 プロトコルだけ（V2 の並び順を保持）
    expect(allView.reducedProtocols).toEqual([
      "FIRE",
      "WATER",
      "HATE",
      "LUCK",
      "WAR",
      "COURAGE",
    ]);
    // 別表現: 3x3 のクロス積 × 双方向 = 18 ペア（いずれも g=3）
    expect(allView.pairs).toHaveLength(18);
    // 全プロトコル表示用の protocols は V2 全体のまま（30×30）
    expect(allView.protocols).toHaveLength(v2Protocols.length);

    // ペア一覧は全タブに供給される（純Main1戦が無いので v1aux は空配列）
    expect(result.current.matrixViews.v1aux.pairs).toEqual([]);
    expect(result.current.matrixViews.main2aux.pairs).toBeDefined();
    expect(result.current.matrixViews.ratio.pairs).toBeDefined();
  });

  it("戻り値に strengthModelNormal / strengthModelRatio が含まれ ratio フラグでスライスされている", () => {
    const matches = [
      createMatch("1", 100, 100, false), // Normal
      createMatch("2", 100, 100, false), // Normal
      createMatch("3", 100, 100, true), // Ratio
    ];

    const { result } = renderHook(() => useMatchStats(matches, testProtocols));

    // strengthModelNormal は通常戦のみ（2試合）
    expect(result.current.strengthModelNormal.games).toBe(2);
    // strengthModelRatio はレシオ戦のみ（1試合）
    expect(result.current.strengthModelRatio.games).toBe(1);
    // 全体 strengthModel は全試合（3試合）
    expect(result.current.strengthModel.games).toBe(3);
  });

  it("戻り値に thetaBootstrap が含まれ intervals と samples を持つ", () => {
    const matches = [
      createMatch("1", 100, 100, false),
      createMatch("2", 100, 100, false),
    ];
    const { result } = renderHook(() => useMatchStats(matches, testProtocols));
    const tb = result.current.thetaBootstrap;
    expect(tb).toBeDefined();
    expect(typeof tb.samples).toBe("number");
    expect(tb.samples).toBeGreaterThan(0);
    expect(typeof tb.intervals).toBe("object");
  });

  it("試合が 0 件のとき thetaBootstrap は空の intervals と samples=0 を返す", () => {
    const { result } = renderHook(() => useMatchStats([], testProtocols));
    const tb = result.current.thetaBootstrap;
    expect(tb.samples).toBe(0);
    expect(tb.intervals).toEqual({});
  });

  describe("matrixViews.ratio の軸は ratioProtocols に従う", () => {
    const createRatioMatch = (id: string): Match =>
      ({
        id,
        matchDate: 100,
        createdAt: 100,
        ratio: true,
        first: ["DARKNESS", "FIRE", "PSYCHIC"],
        second: ["DEATH", "GRAVITY", "WATER"],
        winner: "FIRST",
        userId: "test",
      }) as Match;

    it("ratioProtocols に PROTOCOL_SETS.V1 を渡すと、HATE/LOVE/APATHY を含まない軸になる", () => {
      const v1Protocols = PROTOCOL_SETS.V1 as unknown as readonly Protocol[];
      const matches = [createRatioMatch("1")];

      const { result } = renderHook(() =>
        useMatchStats(matches, testProtocols, v1Protocols),
      );

      const ratioView = result.current.matrixViews.ratio;
      expect(ratioView.protocols).toEqual(v1Protocols);
      expect(ratioView.protocols).not.toContain("HATE");
      expect(ratioView.protocols).not.toContain("LOVE");
      expect(ratioView.protocols).not.toContain("APATHY");
    });

    it("ratioProtocols に PROTOCOL_SETS.V1_AUX を渡すと従来どおり V1_AUX 全体の軸になる", () => {
      const v1AuxProtocols =
        PROTOCOL_SETS.V1_AUX as unknown as readonly Protocol[];
      const matches = [createRatioMatch("1")];

      const { result } = renderHook(() =>
        useMatchStats(matches, testProtocols, v1AuxProtocols),
      );

      const ratioView = result.current.matrixViews.ratio;
      expect(ratioView.protocols).toEqual(v1AuxProtocols);
      expect(ratioView.protocols).toContain("HATE");
      expect(ratioView.protocols).toContain("LOVE");
      expect(ratioView.protocols).toContain("APATHY");
    });
  });
});
