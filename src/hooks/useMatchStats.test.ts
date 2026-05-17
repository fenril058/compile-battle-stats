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
});
