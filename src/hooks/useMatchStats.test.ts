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
});
