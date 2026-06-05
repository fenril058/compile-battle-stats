import type React from "react";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MIN_GAMES_FOR_MATRIX } from "../config";
import type { MatrixView, StatsView } from "../hooks/useMatchStats";
import { type TranslationKey, useT } from "../i18n";
import type {
  ArchetypeMatchup,
  StrengthModel,
  SynergyPair,
  UsageTimeline,
} from "../utils/logic";
import { Archetypes } from "./Archetypes";
import { Explainer } from "./Explainer";
import { Matrix } from "./Matrix";
import { MatrixPairList } from "./MatrixPairList";
import { Quadrant } from "./Quadrant";
import { Stat } from "./Stat";
import { Strength } from "./Strength";
import { Synergy } from "./Synergy";
import { UsageTimeline as UsageTimelineChart } from "./UsageTimeline";

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
  strengthModel: StrengthModel;
  synergy: readonly SynergyPair[];
  usage: UsageTimeline;
  archetypes: ArchetypeMatchup;
}

const STAT_VIEW_KEYS = ["all", "v1aux", "main2aux", "mixed"] as const;
type StatViewKey = (typeof STAT_VIEW_KEYS)[number];
const STAT_VIEW_LABELS: Record<StatViewKey, TranslationKey> = {
  all: "statsDashboard.view.all",
  v1aux: "statsDashboard.view.main1",
  main2aux: "statsDashboard.view.main2",
  mixed: "statsDashboard.view.mixed",
};

// 散布図の対象スライス（全体 / 通常戦 / レシオ）。activeStats の各 slice を引く。
const QUADRANT_TYPES = ["all", "normal", "ratio"] as const;
type QuadrantType = (typeof QUADRANT_TYPES)[number];
const QUADRANT_TYPE_LABELS: Record<QuadrantType, TranslationKey> = {
  all: "statsDashboard.view.all",
  normal: "statsDashboard.stat.normal",
  ratio: "common.ratio",
};

const MATRIX_KEYS = ["all", "v1aux", "main2aux", "ratio"] as const;
type MatrixKey = (typeof MATRIX_KEYS)[number];
const MATRIX_TAB_LABELS: Record<MatrixKey, TranslationKey> = {
  all: "statsDashboard.view.all",
  v1aux: "statsDashboard.view.main1",
  main2aux: "statsDashboard.view.main2",
  ratio: "statsDashboard.matrix.ratio",
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  statViews,
  matrixViews,
  minPair,
  minTrio,
  strengthModel,
  synergy,
  usage,
  archetypes,
}) => {
  const { t } = useT();
  const [activeStatViewKey, setActiveStatViewKey] =
    useState<StatViewKey>("all");
  const [activeMatrixKey, setActiveMatrixKey] = useState<MatrixKey>("all");
  // 散布図の対象（全体 / 通常戦 / レシオ）。既定は全体。
  const [quadrantType, setQuadrantType] = useState<QuadrantType>("all");
  // 全体相性表の表示範囲。既定は出現プロトコルのみ。
  // トグルで全プロトコル表示に切り替えられる。
  const [matrixCompact, setMatrixCompact] = useState(true);
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
    } else if (e.key === "Home") {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      newIndex = STAT_VIEW_KEYS.length - 1;
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
    } else if (e.key === "Home") {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      newIndex = MATRIX_KEYS.length - 1;
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
        <div
          className="flex flex-wrap gap-1 mb-3"
          role="tablist"
          aria-label={t("statsDashboard.statView")}
        >
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
              {t(STAT_VIEW_LABELS[key])}
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
            title={t("statsDashboard.stat.normal")}
            m={activeStats.normal}
            color="bg-orange-950/20"
            minPair={minPair}
            minTrio={minTrio}
          />
          <Stat
            title={t("common.ratio")}
            m={activeStats.ratio}
            color="bg-blue-950/20"
            minPair={minPair}
            minTrio={minTrio}
          />
          <Stat
            title={t("statsDashboard.stat.combined")}
            m={activeStats.all}
            color="bg-green-950/20"
            minPair={minPair}
            minTrio={minTrio}
          />
        </div>
        <Explainer bodyKey="stat.wilsonExplain" />
      </section>

      {/* Strength section (Bradley-Terry θ / β) */}
      <section>
        <h2 className="font-semibold mb-3">{t("strength.title")}</h2>
        <Strength model={strengthModel} />
        <Explainer bodyKey="strength.explain" />
      </section>

      {/* Synergy section (pair residual vs model) */}
      <section>
        <h2 className="font-semibold mb-3">{t("synergy.title")}</h2>
        <Synergy pairs={synergy} />
        <Explainer bodyKey="synergy.explain" />
      </section>

      {/* Quadrant section */}
      <section>
        <h2 className="font-semibold mb-3">{t("quadrant.title")}</h2>
        <fieldset className="flex flex-wrap items-center gap-1 mb-2 border-0 p-0 m-0 min-w-0">
          <legend className="text-xs text-zinc-400 mr-1 p-0 float-left">
            {t("quadrant.scopeLabel")}
          </legend>
          {QUADRANT_TYPES.map((qt) => (
            <button
              key={qt}
              type="button"
              onClick={() => setQuadrantType(qt)}
              aria-pressed={quadrantType === qt}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                quadrantType === qt
                  ? "bg-zinc-500 text-white font-medium"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {t(QUADRANT_TYPE_LABELS[qt])}
            </button>
          ))}
        </fieldset>
        <Quadrant
          single={activeStats[quadrantType].single}
          title={t("quadrant.title")}
        />
      </section>

      {/* Usage Timeline section */}
      <section>
        <h2 className="font-semibold mb-3">{t("usage.title")}</h2>
        <UsageTimelineChart data={usage} title={t("usage.title")} />
      </section>

      {/* Matrix section */}
      <section>
        <div
          className="flex flex-wrap gap-1 mb-3"
          role="tablist"
          aria-label={t("statsDashboard.matrixView")}
        >
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
              {t(MATRIX_TAB_LABELS[key])}
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
              <legend className="text-xs text-zinc-400 mr-1 p-0 float-left">
                {t("statsDashboard.displayRange")}
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
                {t("statsDashboard.appearedOnly")}
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
                {t("statsDashboard.allProtocols")}
              </button>
            </fieldset>
          )}
          {matrixCompactEmpty ? (
            <p className="text-sm text-zinc-400 text-center py-12">
              {t("statsDashboard.matrixEmpty", { games: MIN_GAMES_FOR_MATRIX })}
            </p>
          ) : (
            <>
              {/* 主表示: モデル残差ヒートマップ（交絡を外したカウンター） */}
              <Matrix
                variant="residual"
                title={t("statsDashboard.residualTitle", {
                  name: t(MATRIX_TAB_LABELS[activeMatrixKey]),
                })}
                m={activeView.residual}
                bg="bg-zinc-900/50"
                protocols={matrixProtocols}
                theta={strengthModel.theta}
              />
              <p className="text-[10px] text-zinc-500 -mt-4 mb-2 text-center">
                {t("statsDashboard.residualNote")}
              </p>
              <Explainer bodyKey="statsDashboard.residualExplain" />
              <div className="mb-4" />
              {/* 旧表示: 実測勝率の相性表 + 出現ペア一覧（折りたたみ保存） */}
              <details className="mt-1">
                <summary className="cursor-pointer select-none text-sm text-zinc-400">
                  {t("statsDashboard.matrixOld")}
                </summary>
                <div className="mt-2">
                  <Matrix
                    title={t("statsDashboard.matrixTitle", {
                      name: t(MATRIX_TAB_LABELS[activeMatrixKey]),
                    })}
                    m={activeView.data}
                    bg="bg-zinc-900/50"
                    protocols={matrixProtocols}
                  />
                  {activeView.pairs !== undefined && (
                    <div className="mt-2 overflow-x-auto">
                      <MatrixPairList pairs={activeView.pairs} />
                    </div>
                  )}
                </div>
              </details>
            </>
          )}
        </div>
      </section>

      {/* Archetype section (共起クラスタ) */}
      <section>
        <h2 className="font-semibold mb-3">{t("archetype.title")}</h2>
        <Archetypes data={archetypes} />
        <Explainer bodyKey="archetype.explain" />
      </section>
    </>
  );
};
