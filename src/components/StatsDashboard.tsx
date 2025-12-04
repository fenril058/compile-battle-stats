import React from 'react';
import { Stat } from "./Stat";
import { Matrix } from "./Matrix";
import type { MatrixData, StatsResult, Protocol } from "../types"; // types定義に合わせて調整してください

// Propsの定義
interface StatsDashboardProps {
  stats: {
    normal: StatsResult;
    ratio: StatsResult;
    all: StatsResult;
  };
  matrices: {
    normal: MatrixData; // typesの定義に合わせて修正
    ratio: MatrixData;
    all: MatrixData;
  };
  protocols: readonly Protocol[];
  minPair: number;
  minTrio: number;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  matrices,
  protocols,
  minPair,
  minTrio
}) => {
  return (
    <>
      {/* Visualization Section: Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat t="通常戦" m={stats.normal} color="bg-orange-950/20" minPair={minPair} minTrio={minTrio} />
        <Stat t="レシオ" m={stats.ratio} color="bg-blue-950/20" minPair={minPair} minTrio={minTrio} />
        <Stat t="全体" m={stats.all} color="bg-green-950/20" minPair={minPair} minTrio={minTrio} />
      </section>

      {/* Visualization Section: Matrices */}
      <section className="space-y-8">
        <div className="overflow-x-auto">
          <Matrix t="通常戦 相性表" m={matrices.normal} bg="bg-zinc-900/50" protocols={protocols} />
        </div>
        <div className="overflow-x-auto">
          <Matrix t="レシオ 相性表" m={matrices.ratio} bg="bg-zinc-900/50" protocols={protocols} />
        </div>
        <div className="overflow-x-auto">
           <Matrix t="全試合 相性表" m={matrices.all} bg="bg-zinc-900/50" protocols={protocols} />
        </div>
      </section>
    </>
  );
};
