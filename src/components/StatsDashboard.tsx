import type React from "react";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MIN_GAMES_FOR_MATRIX } from "../config";
import type { MatrixView, StatsView } from "../hooks/useMatchStats";
import { Matrix } from "./Matrix";
import { MatrixPairList } from "./MatrixPairList";
import { Stat } from "./Stat";

interface StatsDashboardProps {
  statViews: {
    all: StatsView;
    v1aux: StatsView;
    main2aux: StatsView;
    mixed: StatsView;
  };
  matrixViews: {
    all: MatrixView;
    v1aux: MatrixView;
    main2aux: MatrixView;
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

const MATRIX_KEYS = ["all", "v1aux", "main2aux", "ratio"] as const;
type MatrixKey = (typeof MATRIX_KEYS)[number];
const MATRIX_TAB_LABELS: Record<MatrixKey, string> = {
  all: "全体",
  v1aux: "Main1",
  main2aux: "Main2",
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
  const [activeMatrixKey, setActiveMatrixKey] = useState<MatrixKey>("all");
  // 全体相性表の表示範囲。既定は全プロトコル（全試合の 30×30 をそのまま）。
  // 未使用プロトコルの空行を畳みたい場合は「出現のみ」に切り替えられる。
  const [matrixCompact, setMatrixCompact] = useState(false);
  const statTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const matrixTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const statBaseId = useId();
  const matrixBaseId = useId();
  const statPanelId = `${statBaseId}-panel`;
  const matrixPanelId = `${matrixBaseId}-panel`;
  const activeStats = statViews[activeStatViewKey];
  const activeView = matrixViews[activeMatrixKey];

  // 全体相性表のみ縮約（出現プロトコルだけに絞る）を適用できる。
  const isAllMatrix = activeMatrixKey === "all";
  const useReducedMatrix =
    isAllMatrix && matrixCompact && activeView.reducedProtocols !== undefined;
  const matrixProtocols = useReducedMatrix
    ? (activeView.reducedProtocols ?? activeView.protocols)
    : activeView.protocols;
  // 縮約した結果、表示できるプロトコルが無い（＝MIN_GAMES到達の対戦が無い）状態。
  const matrixCompactEmpty = useReducedMatrix && matrixProtocols.length === 0;

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
            t="通常+レシオ"
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
          {isAllMatrix && (
            <fieldset className="flex flex-wrap items-center gap-1 mb-2 border-0 p-0 m-0 min-w-0">
              <legend className="text-xs text-zinc-500 mr-1 p-0 float-left">
                表示範囲:
              </legend>
              <button
                type="button"
                onClick={() => setMatrixCompact(true)}
                aria-pressed={matrixCompact}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  matrixCompact
                    ? "bg-zinc-500 text-white font-medium"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                出現のみ
              </button>
              <button
                type="button"
                onClick={() => setMatrixCompact(false)}
                aria-pressed={!matrixCompact}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  !matrixCompact
                    ? "bg-zinc-500 text-white font-medium"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                全プロトコル
              </button>
            </fieldset>
          )}
          {matrixCompactEmpty ? (
            <p className="text-sm text-zinc-500 text-center py-12">
              {MIN_GAMES_FOR_MATRIX} 戦以上の対戦データがまだありません。
            </p>
          ) : (
            <Matrix
              t={`${MATRIX_TAB_LABELS[activeMatrixKey]} 相性表`}
              m={activeView.data}
              bg="bg-zinc-900/50"
              protocols={matrixProtocols}
            />
          )}
          {activeView.pairs !== undefined && (
            <details className="mt-1">
              <summary className="cursor-pointer select-none text-sm text-zinc-400">
                出現ペア一覧（実験的）
              </summary>
              <div className="mt-2 overflow-x-auto">
                <MatrixPairList pairs={activeView.pairs} />
              </div>
            </details>
          )}
        </div>
      </section>
    </>
  );
};
