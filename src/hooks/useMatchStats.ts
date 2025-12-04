import { useMemo } from "react";
import type { Match } from "../types";
import { makeStats, matchup } from "../utils/logic";

export const useMatchStats = (matches: Match[]) => {
  // === ソートロジック ===
  // 試合日(matchDate)の降順 > 登録日時(createdAt)の降順
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      // 1. matchDateが存在する場合、matchDateでソート (新しい日付が前)
      const matchDateA = a.matchDate ?? 0;
      const matchDateB = b.matchDate ?? 0;

      if (matchDateA !== matchDateB) {
        return matchDateB - matchDateA;
      }

      // 2. matchDateが同じか、存在しない場合、createdAtでソート (新しい登録が前)
      return b.createdAt - a.createdAt;
    });
  }, [matches]);

  // === フィルタリング ===
  const normalMatches = useMemo(
    () => matches.filter((m) => !m.ratio),
    [matches],
  );

  const ratioMatches = useMemo(() => matches.filter((m) => m.ratio), [matches]);

  // === 統計データ (Stat用) ===
  const stats = useMemo(
    () => ({
      all: makeStats(matches),
      normal: makeStats(normalMatches),
      ratio: makeStats(ratioMatches),
    }),
    [matches, normalMatches, ratioMatches],
  );

  // === 相性表データ (Matrix用) ===
  const matrices = useMemo(
    () => ({
      all: matchup(matches),
      normal: matchup(normalMatches),
      ratio: matchup(ratioMatches),
    }),
    [matches, normalMatches, ratioMatches],
  );

  return { stats, matrices, sortedMatches };
};
