import type React from "react";
import { useState } from "react";
import type { MatrixView, StatsView } from "../hooks/useMatchStats";
import { Matrix } from "./Matrix";
import { Stat } from "./Stat";

interface StatsDashboardProps {
  statViews: {
    all: StatsView;
    v1aux: StatsView;
    main2aux: StatsView;
    mixed: StatsView;
  };
  matrixViews: {
    v1aux: MatrixView;
    main2aux: MatrixView;
    mixed: MatrixView;
    ratio: MatrixView;
  };
  minPair: number;
  minTrio: number;
}

const STAT_VIEW_KEYS = ["all", "v1aux", "main2aux", "mixed"] as const;
type StatViewKey = (typeof STAT_VIEW_KEYS)[number];
const STAT_VIEW_LABELS: Record<StatViewKey, string> = {
  all: "全体",
  v1aux: "Main1",
  main2aux: "Main2",
  mixed: "混合",
};

const MATRIX_KEYS = ["v1aux", "main2aux", "mixed", "ratio"] as const;
type MatrixKey = (typeof MATRIX_KEYS)[number];
const MATRIX_TAB_LABELS: Record<MatrixKey, string> = {
  v1aux: "Main1",
  main2aux: "Main2",
  mixed: "混合",
  ratio: "レシオ(Main1)",
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  statViews,
  matrixViews,
  minPair,
  minTrio,
}) => {
  const [activeStatViewKey, setActiveStatViewKey] =
    useState<StatViewKey>("all");
  const [activeMatrixKey, setActiveMatrixKey] = useState<MatrixKey>("v1aux");
  const activeStats = statViews[activeStatViewKey];
  const activeView = matrixViews[activeMatrixKey];

  return (
    <>
      {/* Stat section */}
      <section>
        <div className="flex flex-wrap gap-1 mb-3">
          {STAT_VIEW_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveStatViewKey(key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeStatViewKey === key
                  ? "bg-zinc-500 text-white font-medium"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {STAT_VIEW_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <Stat
            t="通常戦"
            m={activeStats.normal}
            color="bg-orange-950/20"
            minPair={minPair}
            minTrio={minTrio}
          />
          <Stat
            t="レシオ"
            m={activeStats.ratio}
            color="bg-blue-950/20"
            minPair={minPair}
            minTrio={minTrio}
          />
          <Stat
            t="全体"
            m={activeStats.all}
            color="bg-green-950/20"
            minPair={minPair}
            minTrio={minTrio}
          />
        </div>
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
            m={activeView.data}
            bg="bg-zinc-900/50"
            protocols={activeView.protocols}
          />
        </div>
      </section>
    </>
  );
};
