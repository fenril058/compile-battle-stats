import type React from "react";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
  const statTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const matrixTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const statBaseId = useId();
  const matrixBaseId = useId();
  const statPanelId = `${statBaseId}-panel`;
  const matrixPanelId = `${matrixBaseId}-panel`;
  const activeStats = statViews[activeStatViewKey];
  const activeView = matrixViews[activeMatrixKey];

  const handleStatTabChange = (key: StatViewKey) => {
    if (!document.startViewTransition) {
      setActiveStatViewKey(key);
      return;
    }
    document.startViewTransition(() => {
      flushSync(() => setActiveStatViewKey(key));
    });
  };

  const handleStatTabKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = STAT_VIEW_KEYS.indexOf(activeStatViewKey);
    let newIndex = -1;

    if (e.key === "ArrowLeft" && currentIndex > 0) {
      e.preventDefault();
      newIndex = currentIndex - 1;
    } else if (
      e.key === "ArrowRight" &&
      currentIndex < STAT_VIEW_KEYS.length - 1
    ) {
      e.preventDefault();
      newIndex = currentIndex + 1;
    }

    if (newIndex !== -1) {
      handleStatTabChange(STAT_VIEW_KEYS[newIndex]);
      statTabRefs.current[newIndex]?.focus();
    }
  };

  const handleMatrixTabChange = (key: MatrixKey) => {
    if (!document.startViewTransition) {
      setActiveMatrixKey(key);
      return;
    }
    document.startViewTransition(() => {
      flushSync(() => setActiveMatrixKey(key));
    });
  };

  const handleMatrixTabKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = MATRIX_KEYS.indexOf(activeMatrixKey);
    let newIndex = -1;

    if (e.key === "ArrowLeft" && currentIndex > 0) {
      e.preventDefault();
      newIndex = currentIndex - 1;
    } else if (
      e.key === "ArrowRight" &&
      currentIndex < MATRIX_KEYS.length - 1
    ) {
      e.preventDefault();
      newIndex = currentIndex + 1;
    }

    if (newIndex !== -1) {
      handleMatrixTabChange(MATRIX_KEYS[newIndex]);
      matrixTabRefs.current[newIndex]?.focus();
    }
  };

  return (
    <>
      {/* Stat section */}
      <section>
        <div className="flex flex-wrap gap-1 mb-3" role="tablist">
          {STAT_VIEW_KEYS.map((key, index) => (
            <button
              key={key}
              id={`${statBaseId}-tab-${key}`}
              ref={(el) => {
                statTabRefs.current[index] = el;
              }}
              type="button"
              onClick={() => handleStatTabChange(key)}
              onKeyDown={handleStatTabKeyDown}
              role="tab"
              aria-selected={activeStatViewKey === key}
              aria-controls={statPanelId}
              tabIndex={activeStatViewKey === key ? 0 : -1}
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
        <div
          id={statPanelId}
          role="tabpanel"
          aria-labelledby={`${statBaseId}-tab-${activeStatViewKey}`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: APG のタブパターンでは、フォーカス可能な子を持たない tabpanel を tabIndex=0 でフォーカス可能にする
          tabIndex={0}
          style={{ viewTransitionName: "stat-panel" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start"
        >
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
        <div className="flex flex-wrap gap-1 mb-3" role="tablist">
          {MATRIX_KEYS.map((key, index) => (
            <button
              key={key}
              id={`${matrixBaseId}-tab-${key}`}
              ref={(el) => {
                matrixTabRefs.current[index] = el;
              }}
              type="button"
              onClick={() => handleMatrixTabChange(key)}
              onKeyDown={handleMatrixTabKeyDown}
              role="tab"
              aria-selected={activeMatrixKey === key}
              aria-controls={matrixPanelId}
              tabIndex={activeMatrixKey === key ? 0 : -1}
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
        <div
          id={matrixPanelId}
          role="tabpanel"
          aria-labelledby={`${matrixBaseId}-tab-${activeMatrixKey}`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: APG のタブパターンでは、フォーカス可能な子を持たない tabpanel を tabIndex=0 でフォーカス可能にする
          tabIndex={0}
          style={{ viewTransitionName: "matrix-panel" }}
          className="overflow-x-auto"
        >
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
