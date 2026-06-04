import React, { useId, useMemo, useRef, useState } from "react";
import { type TranslationKey, useT } from "../i18n";
import type { StatsResult } from "../types";
import { rows } from "../utils/logic";

type StatKey = keyof StatsResult;

const KEYS: readonly StatKey[] = ["single", "pair", "trio", "first", "second"];

const TAB_LABELS: Record<StatKey, TranslationKey> = {
  single: "stat.tab.single",
  pair: "stat.tab.pair",
  trio: "stat.tab.trio",
  first: "common.first",
  second: "common.second",
};

const SECTION_LABELS: Record<StatKey, TranslationKey> = {
  single: "stat.section.single",
  pair: "stat.section.pair",
  trio: "stat.section.trio",
  first: "stat.section.first",
  second: "stat.section.second",
};

type StatProps = {
  title: string;
  m: StatsResult;
  color: string;
  minPair: number;
  minTrio: number;
};

export const Stat: React.FC<StatProps> = React.memo(
  ({ title, m, color, minPair, minTrio }) => {
    const { t } = useT();
    const [activeKey, setActiveKey] = useState<StatKey>("single");
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const baseId = useId();
    const panelId = `${baseId}-panel`;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const currentIndex = KEYS.indexOf(activeKey);
      let newIndex = -1;

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        newIndex = currentIndex - 1;
      } else if (e.key === "ArrowRight" && currentIndex < KEYS.length - 1) {
        e.preventDefault();
        newIndex = currentIndex + 1;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = KEYS.length - 1;
      }

      if (newIndex !== -1) {
        setActiveKey(KEYS[newIndex]);
        tabRefs.current[newIndex]?.focus();
      }
    };

    return (
      <div className={`p-3 rounded-2xl shadow-md ${color}`}>
        <h2 className="font-semibold mb-2 text-center">{title}</h2>
        <div
          className="flex flex-wrap gap-1 mb-3"
          role="tablist"
          aria-label={t("statsDashboard.statTypeAria")}
        >
          {KEYS.map((key, index) => (
            <button
              key={key}
              id={`${baseId}-tab-${key}`}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              onClick={() => setActiveKey(key)}
              onKeyDown={handleKeyDown}
              role="tab"
              aria-selected={activeKey === key}
              aria-controls={panelId}
              tabIndex={activeKey === key ? 0 : -1}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                activeKey === key
                  ? "bg-zinc-500 text-white font-medium"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {t(TAB_LABELS[key])}
            </button>
          ))}
        </div>
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeKey}`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: APG のタブパターンでは、フォーカス可能な子を持たない tabpanel を tabIndex=0 でフォーカス可能にする
          tabIndex={0}
        >
          <StatSection
            label={t(SECTION_LABELS[activeKey])}
            data={m[activeKey]}
            type={activeKey}
            minPair={minPair}
            minTrio={minTrio}
          />
        </div>
      </div>
    );
  },
);

type StatSectionProps = {
  label: string;
  data: StatsResult[StatKey];
  type: StatKey;
  minPair: number;
  minTrio: number;
};

const StatSection: React.FC<StatSectionProps> = ({
  label,
  data,
  type,
  minPair,
  minTrio,
}) => {
  const { t } = useT();
  // 旧表示と同じ p 降順。`(old version)` の折りたたみ表でそのまま使う。
  const r = useMemo(() => {
    if (!data) return [];
    return rows(data, type, minPair, minTrio);
  }, [data, type, minPair, minTrio]);

  // forest plot の主表示は Wilson 下限の降順。小サンプルの偶然が上位に来るのを防ぐ。
  const forest = useMemo(
    () => [...r].sort((a, b) => b.low - a.low || b.p - a.p),
    [r],
  );

  let displayLabel = label;
  if (type === "pair") {
    displayLabel = t("stat.minGames", { label, games: minPair });
  } else if (type === "trio") {
    displayLabel = t("stat.minGames", { label, games: minTrio });
  }

  return (
    <div>
      <h3 className="text-sm text-zinc-400 mb-1 text-center">{displayLabel}</h3>
      {r.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-4">
          {t("common.noData")}
        </p>
      ) : (
        <>
          <p className="text-[10px] text-zinc-500 mb-1 text-center">
            {t("stat.sortNote")}
          </p>
          <ul aria-label={displayLabel} className="space-y-0.5">
            {forest.map((v, i) => {
              // 勝率で点の色分け（旧表の行ハイライトと同じ閾値）。
              const dot =
                v.p > 60
                  ? "bg-green-400"
                  : v.p < 40
                    ? "bg-red-400"
                    : "bg-zinc-300";
              return (
                <li
                  key={v.n}
                  className="flex items-center gap-1 text-xs"
                  aria-label={t("stat.ci.aria", {
                    n: v.n,
                    p: v.p.toFixed(1),
                    low: v.low.toFixed(1),
                    high: v.high.toFixed(1),
                    g: v.g,
                  })}
                >
                  <span className="w-4 text-right text-zinc-500 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="w-16 truncate" title={v.n}>
                    {v.n}
                  </span>
                  <span className="w-5 text-right text-zinc-500 tabular-nums">
                    {v.g}
                  </span>
                  {/* 0..100 のトラック。CI 区間バー＋点推定マーカー＋50% 基準線。視覚情報なので
                      aria-hidden（行全体の aria-label が同内容を読み上げる）。 */}
                  <span
                    aria-hidden="true"
                    className="relative flex-1 h-3 rounded bg-zinc-800"
                  >
                    <span
                      className="absolute top-0 bottom-0 border-l border-zinc-600"
                      style={{ left: "50%" }}
                    />
                    <span
                      className="absolute h-0.5 bg-zinc-500"
                      style={{
                        left: `${v.low}%`,
                        width: `${Math.max(0, v.high - v.low)}%`,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                    <span
                      className={`absolute w-1.5 h-1.5 rounded-full ${dot}`}
                      style={{
                        left: `${v.p}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </span>
                  <span className="w-10 text-right tabular-nums">
                    {v.p.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
          <details className="mt-2">
            <summary className="cursor-pointer select-none text-xs text-zinc-400">
              {t("stat.oldTable")}
            </summary>
            <table className="mt-1 text-xs w-full border border-zinc-800">
              <caption className="sr-only">{displayLabel}</caption>
              <thead className="bg-zinc-800 text-zinc-300">
                <tr>
                  <th className="p-1" scope="col">
                    #
                  </th>
                  <th className="p-1" scope="col">
                    PRO
                  </th>
                  <th className="p-1" scope="col">
                    G
                  </th>
                  <th className="p-1" scope="col">
                    W
                  </th>
                  <th className="p-1" scope="col">
                    L
                  </th>
                  <th className="p-1" scope="col">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {r.map((v, i) => (
                  <tr
                    key={v.n}
                    className={`border-t border-zinc-800 text-center ${v.p > 60 ? "bg-green-900/30" : v.p < 40 ? "bg-red-900/30" : ""}`}
                  >
                    <td className="p-1">{i + 1}</td>
                    <td className="p-1">{v.n}</td>
                    <td className="p-1">{v.g}</td>
                    <td className="p-1">{v.w}</td>
                    <td className="p-1">{v.l}</td>
                    <td className="p-1">{v.p.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
};
