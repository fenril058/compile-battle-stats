import { useMemo } from "react";
import { makeStats, matchup } from "../utils/logic"; // 既存のロジックをインポート
import type { Match } from "../types";

export const useMatchStats = (matches: Match[]) => {
  const normalMatches = useMemo(
    () => matches.filter((m) => !m.ratio),
    [matches]
  );
  const ratioMatches = useMemo(
    () => matches.filter((m) => m.ratio),
    [matches]
  );

  // 統計データ (Stat用)
  const stats = useMemo(() => ({
    all: makeStats(matches),
    normal: makeStats(normalMatches),
    ratio: makeStats(ratioMatches),
  }), [matches, normalMatches, ratioMatches]);

  // 相性表データ (Matrix用)
  const matrices = useMemo(() => ({
    all: matchup(matches),
    normal: matchup(normalMatches),
    ratio: matchup(ratioMatches),
  }), [matches, normalMatches, ratioMatches]);

  return { stats, matrices };
};
