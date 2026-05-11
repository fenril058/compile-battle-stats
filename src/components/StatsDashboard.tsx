import type React from "react";
import { useState } from "react";
import type { MatrixData, Protocol, StatsResult } from "../types";
import { Matrix } from "./Matrix";
import { Stat } from "./Stat";

interface StatsDashboardProps {
  stats: {
    normal: StatsResult;
    ratio: StatsResult;
    all: StatsResult;
  };
  matrices: {
    normal: MatrixData;
    ratio: MatrixData;
    all: MatrixData;
  };
  protocols: readonly Protocol[];
  minPair: number;
  minTrio: number;
}

const MATRIX_KEYS = ["normal", "ratio", "all"] as const;
type MatrixKey = (typeof MATRIX_KEYS)[number];
const MATRIX_TAB_LABELS: Record<MatrixKey, string> = {
  normal: "通常戦",
  ratio: "レシオ",
  all: "全体",
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  matrices,
  protocols,
  minPair,
  minTrio,
}) => {
  const [activeMatrixKey, setActiveMatrixKey] = useState<MatrixKey>("normal");

  return (
    <>
      {/* Stat section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <Stat
          t="通常戦"
          m={stats.normal}
          color="bg-orange-950/20"
          minPair={minPair}
          minTrio={minTrio}
        />
        <Stat
          t="レシオ"
          m={stats.ratio}
          color="bg-blue-950/20"
          minPair={minPair}
          minTrio={minTrio}
        />
        <Stat
          t="全体"
          m={stats.all}
          color="bg-green-950/20"
          minPair={minPair}
          minTrio={minTrio}
        />
      </section>

      {/* Matrix section */}
      <section>
        <div className="flex flex-wrap gap-1 mb-3">
          {MATRIX_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMatrixKey(key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeMatrixKey === key
                  ? "bg-zinc-500 text-white font-medium"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {MATRIX_TAB_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <Matrix
            t={`${MATRIX_TAB_LABELS[activeMatrixKey]} 相性表`}
            m={matrices[activeMatrixKey]}
            bg="bg-zinc-900/50"
            protocols={protocols}
          />
        </div>
      </section>
    </>
  );
};
