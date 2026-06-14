import { useMemo } from "react";
import { PROTOCOL_SETS } from "../config";
import {
  type ArchetypeMatchup,
  archetypeMatchup,
  bootstrapTheta,
  fitStrengthModel,
  type MatchupPair,
  makeStats,
  matchup,
  matchupPairs,
  matchupResidual,
  pairSynergy,
  recommendTrios,
  type StrengthModel,
  type SynergyPair,
  type ThetaBootstrap,
  type TrioRecommendation,
  type UsageTimeline,
  usageTimeline,
} from "../lib/logic";
import type {
  Match,
  MatrixData,
  Protocol,
  Ratios,
  StatsResult,
} from "../types";

// Module-level sets for O(1) protocol lookup.
// Protocol 型が V2 まで広がったので、PROTOCOL_SETS の値はそのまま Protocol[] として扱える（#73）。
const V1_AUX_SET = new Set<string>(PROTOCOL_SETS.V1_AUX);
const V1_AUX_PROTOCOLS: readonly Protocol[] = PROTOCOL_SETS.V1_AUX;
const MAIN2_AUX2_PROTOCOLS: readonly Protocol[] = PROTOCOL_SETS.V2.filter(
  (p) => !V1_AUX_SET.has(p),
);
const MAIN2_AUX2_SET = new Set<string>(MAIN2_AUX2_PROTOCOLS);

const isV1AuxTrio = (trio: readonly string[]) =>
  trio.every((p) => V1_AUX_SET.has(p));
const isMain2Aux2Trio = (trio: readonly string[]) =>
  trio.every((p) => MAIN2_AUX2_SET.has(p));

export type MatrixView = {
  data: MatrixData;
  // 実測勝率 − モデル期待（残差ヒートマップ用、0中心）。data と同じ protocols で対応。
  residual: MatrixData;
  protocols: readonly Protocol[];
  // 出現したプロトコル（MIN_GAMES到達セルを持つもの）だけに絞った行/列。
  // 全体相性表（全試合）の縮約表示に使う。未指定なら protocols と同じ扱い。
  reducedProtocols?: readonly Protocol[];
  // 相性表の別表現（実験的）。MIN_GAMES到達の有向ペアのみ。
  pairs?: readonly MatchupPair[];
};

export type StatsView = {
  normal: StatsResult;
  ratio: StatsResult;
  all: StatsResult;
};

export const useMatchStats = (
  matches: Match[],
  protocols: readonly Protocol[],
  ratioProtocols: readonly Protocol[] = V1_AUX_PROTOCOLS,
  ratios?: Ratios,
  maxRatio?: number,
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

  // 全体相性表（全試合・全プロトコルの 30×30）の補助データ。
  // 別表現用のペア一覧と、出現プロトコルだけに絞った行/列（縮約）を用意する。
  const allPairs = useMemo(() => matchupPairs(matches), [matches]);
  const allReducedProtocols = useMemo(() => {
    const seen = new Set<string>();
    for (const pr of allPairs) {
      seen.add(pr.a);
      seen.add(pr.b);
    }
    return protocols.filter((p) => seen.has(p));
  }, [allPairs, protocols]);

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

  // 交絡を外したプロトコル強度 θ と先攻補正 β（全有効試合から推定）。
  // 相性表の残差計算でも使うので matrixViews より前に置く。
  const strengthModel: StrengthModel = useMemo(
    () => fitStrengthModel(matches),
    [matches],
  );

  // 通常戦 / レシオ戦それぞれの先攻補正 β を個別推定。
  const strengthModelNormal: StrengthModel = useMemo(
    () => fitStrengthModel(normalMatches),
    [normalMatches],
  );
  const strengthModelRatio: StrengthModel = useMemo(
    () => fitStrengthModel(ratioMatchesForStats),
    [ratioMatchesForStats],
  );

  const matrixViews = useMemo(
    () => ({
      // 全試合・全プロトコルの相性表（30×30）。縮約と別表現の補助データ付き。
      all: {
        data: matchup(matches, protocols),
        residual: matchupResidual(matches, strengthModel, protocols),
        protocols,
        reducedProtocols: allReducedProtocols,
        pairs: allPairs,
      },
      v1aux: {
        data: matchup(v1AuxMatches, V1_AUX_PROTOCOLS),
        residual: matchupResidual(
          v1AuxMatches,
          strengthModel,
          V1_AUX_PROTOCOLS,
        ),
        protocols: V1_AUX_PROTOCOLS,
        pairs: matchupPairs(v1AuxMatches),
      },
      main2aux: {
        data: matchup(main2Aux2Matches, MAIN2_AUX2_PROTOCOLS),
        residual: matchupResidual(
          main2Aux2Matches,
          strengthModel,
          MAIN2_AUX2_PROTOCOLS,
        ),
        protocols: MAIN2_AUX2_PROTOCOLS,
        pairs: matchupPairs(main2Aux2Matches),
      },
      ratio: {
        data: matchup(ratioMatches, ratioProtocols),
        residual: matchupResidual(ratioMatches, strengthModel, ratioProtocols),
        protocols: ratioProtocols,
        pairs: matchupPairs(ratioMatches),
      },
    }),
    [
      matches,
      v1AuxMatches,
      main2Aux2Matches,
      ratioMatches,
      protocols,
      ratioProtocols,
      allReducedProtocols,
      allPairs,
      strengthModel,
    ],
  );

  // ペアのシナジー残差（実測勝率 − モデル期待勝率）。強度モデルに依存。
  const synergy: SynergyPair[] = useMemo(
    () => pairSynergy(matches, strengthModel),
    [matches, strengthModel],
  );

  // 週別ピック率時系列（全試合対象）。
  const usage: UsageTimeline = useMemo(() => usageTimeline(matches), [matches]);

  // 共起クラスタで抽出したアーキタイプと、その相性。
  const archetypes: ArchetypeMatchup = useMemo(
    () => archetypeMatchup(matches),
    [matches],
  );

  // θ の 95% ブートストラップ区間。
  const thetaBootstrap: ThetaBootstrap = useMemo(
    () => bootstrapTheta(matches),
    [matches],
  );

  // θ + ペアシナジーから推奨トリオ構成（全体 / レシオ対象）。
  const trioRecommendations: {
    all: TrioRecommendation[];
    ratio: TrioRecommendation[];
  } = useMemo(
    () => ({
      all: recommendTrios(matches, strengthModel, { protocols }),
      ratio:
        ratios && maxRatio !== undefined
          ? recommendTrios(ratioMatchesForStats, strengthModelRatio, {
              protocols,
              scope: "ratio",
              ratios,
              maxRatio,
              ratioProtocols,
            })
          : [],
    }),
    [
      matches,
      ratioMatchesForStats,
      strengthModel,
      strengthModelRatio,
      protocols,
      ratios,
      maxRatio,
      ratioProtocols,
    ],
  );

  return {
    statViews,
    matrixViews,
    sortedMatches,
    strengthModel,
    strengthModelNormal,
    strengthModelRatio,
    synergy,
    usage,
    archetypes,
    thetaBootstrap,
    trioRecommendations,
  };
};
