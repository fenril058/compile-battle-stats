import { useMemo } from "react";
import { PROTOCOL_SETS } from "../config";
import type { Match, MatrixData, Protocol } from "../types";
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

  // Stat 用フィルタ（通常戦 / レシオ / 全体）
  const normalMatches = useMemo(
    () => matches.filter((m) => !m.ratio),
    [matches],
  );
  const ratioMatchesForStats = useMemo(
    () => matches.filter((m) => m.ratio),
    [matches],
  );

  const stats = useMemo(
    () => ({
      all: makeStats(matches),
      normal: makeStats(normalMatches),
      ratio: makeStats(ratioMatchesForStats),
    }),
    [matches, normalMatches, ratioMatchesForStats],
  );

  // Matrix 用フィルタ（4種）
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
        data: matchup(ratioMatches, protocols),
        protocols,
      },
    }),
    [v1AuxMatches, main2Aux2Matches, mixedMatches, ratioMatches, protocols],
  );

  return { stats, matrixViews, sortedMatches };
};
