import { useMemo } from "react";
import { PROTOCOL_SETS } from "../config";
import type { Match, MatrixData, Protocol, StatsResult } from "../types";
import { makeStats, matchup } from "../utils/logic";

// Module-level sets for O(1) protocol lookup
const V1_AUX_SET = new Set<string>(PROTOCOL_SETS.V1_AUX);
const V1_AUX_PROTOCOLS = PROTOCOL_SETS.V1_AUX as unknown as readonly Protocol[];
const MAIN2_AUX2_PROTOCOLS = PROTOCOL_SETS.V2.filter(
  (p) => !V1_AUX_SET.has(p),
) as unknown as readonly Protocol[];
const MAIN2_AUX2_SET = new Set<string>(MAIN2_AUX2_PROTOCOLS);

const isV1AuxTrio = (trio: readonly string[]) =>
  trio.every((p) => V1_AUX_SET.has(p));
const isMain2Aux2Trio = (trio: readonly string[]) =>
  trio.every((p) => MAIN2_AUX2_SET.has(p));

export type MatrixView = {
  data: MatrixData;
  protocols: readonly Protocol[];
};

export type StatsView = {
  normal: StatsResult;
  ratio: StatsResult;
  all: StatsResult;
};

export const useMatchStats = (
  matches: Match[],
  protocols: readonly Protocol[],
) => {
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const matchDateA = a.matchDate ?? 0;
      const matchDateB = b.matchDate ?? 0;
      if (matchDateA !== matchDateB) return matchDateB - matchDateA;
      return b.createdAt - a.createdAt;
    });
  }, [matches]);

  // 通常戦 / レシオ フィルタ
  const normalMatches = useMemo(
    () => matches.filter((m) => !m.ratio),
    [matches],
  );
  const ratioMatchesForStats = useMemo(
    () => matches.filter((m) => m.ratio),
    [matches],
  );

  // プロトコルセット別フィルタ（Stat / Matrix 共用）
  const v1AuxMatches = useMemo(
    () => matches.filter((m) => isV1AuxTrio(m.first) && isV1AuxTrio(m.second)),
    [matches],
  );
  const main2Aux2Matches = useMemo(
    () =>
      matches.filter(
        (m) => isMain2Aux2Trio(m.first) && isMain2Aux2Trio(m.second),
      ),
    [matches],
  );
  const mixedMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          !(isV1AuxTrio(m.first) && isV1AuxTrio(m.second)) &&
          !(isMain2Aux2Trio(m.first) && isMain2Aux2Trio(m.second)),
      ),
    [matches],
  );
  const ratioMatches = useMemo(() => matches.filter((m) => m.ratio), [matches]);

  const statViews = useMemo(
    () => ({
      all: {
        normal: makeStats(normalMatches),
        ratio: makeStats(ratioMatchesForStats),
        all: makeStats(matches),
      },
      v1aux: {
        normal: makeStats(v1AuxMatches.filter((m) => !m.ratio)),
        ratio: makeStats(v1AuxMatches.filter((m) => m.ratio)),
        all: makeStats(v1AuxMatches),
      },
      main2aux: {
        normal: makeStats(main2Aux2Matches.filter((m) => !m.ratio)),
        ratio: makeStats(main2Aux2Matches.filter((m) => m.ratio)),
        all: makeStats(main2Aux2Matches),
      },
      mixed: {
        normal: makeStats(mixedMatches.filter((m) => !m.ratio)),
        ratio: makeStats(mixedMatches.filter((m) => m.ratio)),
        all: makeStats(mixedMatches),
      },
    }),
    [
      matches,
      normalMatches,
      ratioMatchesForStats,
      v1AuxMatches,
      main2Aux2Matches,
      mixedMatches,
    ],
  );

  const matrixViews = useMemo(
    () => ({
      v1aux: {
        data: matchup(v1AuxMatches, V1_AUX_PROTOCOLS),
        protocols: V1_AUX_PROTOCOLS,
      },
      main2aux: {
        data: matchup(main2Aux2Matches, MAIN2_AUX2_PROTOCOLS),
        protocols: MAIN2_AUX2_PROTOCOLS,
      },
      mixed: {
        data: matchup(mixedMatches, protocols),
        protocols,
      },
      ratio: {
        data: matchup(ratioMatches, V1_AUX_PROTOCOLS),
        protocols: V1_AUX_PROTOCOLS,
      },
    }),
    [v1AuxMatches, main2Aux2Matches, mixedMatches, ratioMatches, protocols],
  );

  return { statViews, matrixViews, sortedMatches };
};
