import React, { useMemo } from "react";
import { useT } from "../i18n";
import type { UsageTimeline as UsageTimelineData } from "../utils/logic";

type UsageTimelineProps = {
  data: UsageTimelineData;
  title: string;
};

// SVG layout constants
const SVG_WIDTH = 520;
const SVG_HEIGHT = 300;
// 表示上限幅。スマホでは width="100%" でコンテナ幅まで縮むが、PC では
// この上限まで拡大して小さく見えないようにする（viewBox 基準で等比拡大）。
const MAX_DISPLAY_WIDTH = 760;
const MARGIN = { top: 20, right: 20, bottom: 56, left: 52 };
const PLOT_W = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

// Series colors for the top protocols (one distinct color each).
const SERIES_COLORS = [
  "#60a5fa", // blue-400
  "#f87171", // red-400
  "#4ade80", // green-400
  "#fb923c", // orange-400
  "#a78bfa", // violet-400
  "#facc15", // yellow-400
] as const;
// 色数を超えた場合のフォールバック色（topN ≤ 6 では通常使われない）。
const FALLBACK_COLOR = "#71717a"; // zinc-500

/** ピック率 (y, 0..maxY) を SVG 座標に変換する（上が maxY）。 */
const toY = (rate: number, maxY: number): number =>
  ((maxY - rate) / maxY) * PLOT_H;

/** バケットインデックス (x, 0..n-1) を SVG 座標に変換する。 */
const toX = (index: number, n: number): number =>
  n <= 1 ? PLOT_W / 2 : (index / (n - 1)) * PLOT_W;

export const UsageTimeline: React.FC<UsageTimelineProps> = React.memo(
  ({ data, title }) => {
    const { t } = useT();

    const { buckets, series } = data;

    // Y 軸（ピック率）の最大値と目盛り。固定の 25 刻みだと、値が小さいとき
    // 0 と 25 しか出ず粗すぎたため、データに応じて 5% 程度の細かい刻みを選ぶ。
    const { maxY, yTicks } = useMemo(() => {
      let m = 0;
      for (const s of series) {
        for (const pt of s.points) {
          if (pt > m) m = pt;
        }
      }
      // 上に 10% 余白を取った目標上限。目盛りが概ね 4〜6 本になる刻みを選ぶ。
      const target = Math.max(m * 1.1, 1);
      const candidates = [1, 2, 5, 10, 20, 25, 50];
      let step = 50;
      for (const s of candidates) {
        if (target / s <= 6) {
          step = s;
          break;
        }
      }
      const top = Math.ceil(target / step) * step;
      const ticks: number[] = [];
      for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
      return { maxY: top, yTicks: ticks };
    }, [series]);

    if (buckets.length === 0) {
      return (
        <p className="text-sm text-zinc-400 text-center py-12">
          {t("common.noData")}
        </p>
      );
    }

    const n = buckets.length;

    // x 軸ラベルの間引き: バケット数に応じて表示間隔を調整
    const xLabelStep =
      n <= 6 ? 1 : n <= 12 ? 2 : n <= 24 ? 4 : Math.ceil(n / 6);

    const svgAriaLabel = t("usage.svgAriaLabel", { title });
    const tableCaption = t("usage.tableCaption", { title });

    return (
      <div>
        {/* SVG line chart */}
        <svg
          role="img"
          aria-label={svgAriaLabel}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width="100%"
          style={{ display: "block", maxWidth: MAX_DISPLAY_WIDTH }}
          className="overflow-visible"
        >
          <title>{svgAriaLabel}</title>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Plot area background */}
            <rect
              x={0}
              y={0}
              width={PLOT_W}
              height={PLOT_H}
              className="fill-zinc-900/50"
            />

            {/* Y axis gridlines and ticks（データに応じた刻み） */}
            {yTicks.map((v) => (
              <g key={v} transform={`translate(0,${toY(v, maxY)})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={PLOT_W}
                  y2={0}
                  stroke="#3f3f46"
                  strokeWidth={1}
                />
                <line x1={-4} y1={0} x2={0} y2={0} stroke="#52525b" />
                <text
                  x={-6}
                  y={0}
                  dominantBaseline="middle"
                  textAnchor="end"
                  fontSize={9}
                  fill="#a1a1aa"
                >
                  {v}
                </text>
              </g>
            ))}

            {/* Y axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={PLOT_H}
              stroke="#52525b"
              strokeWidth={1}
            />
            {/* X axis */}
            <line
              x1={0}
              y1={PLOT_H}
              x2={PLOT_W}
              y2={PLOT_H}
              stroke="#52525b"
              strokeWidth={1}
            />

            {/* Y axis label */}
            <text
              transform={`rotate(-90) translate(${-PLOT_H / 2},${-MARGIN.left + 12})`}
              textAnchor="middle"
              fontSize={10}
              fill="#a1a1aa"
            >
              {t("usage.yAxis")}
            </text>

            {/* X axis label */}
            <text
              x={PLOT_W / 2}
              y={PLOT_H + MARGIN.bottom - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#a1a1aa"
            >
              {t("usage.xAxis")}
            </text>

            {/* X axis bucket labels (間引き表示) */}
            {buckets.map((b, i) => {
              if (i % xLabelStep !== 0) return null;
              const x = toX(i, n);
              return (
                <text
                  key={b.start}
                  x={x}
                  y={PLOT_H + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#a1a1aa"
                  transform={`rotate(-45, ${x}, ${PLOT_H + 14})`}
                >
                  {b.label}
                </text>
              );
            })}

            {/* X axis tick marks */}
            {buckets.map((b, i) => (
              <line
                key={b.start}
                x1={toX(i, n)}
                y1={PLOT_H}
                x2={toX(i, n)}
                y2={PLOT_H + 4}
                stroke="#52525b"
              />
            ))}

            {/* Series lines */}
            {series.map((s, si) => {
              const color =
                SERIES_COLORS[si % SERIES_COLORS.length] ?? FALLBACK_COLOR;

              // バケットが1個の場合はラインなしで点だけ描画
              const pathD =
                n >= 2
                  ? s.points
                      .map((pt, i) => {
                        const x = toX(i, n);
                        const y = toY(pt, maxY);
                        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                      })
                      .join(" ")
                  : null;

              return (
                <g key={s.protocol}>
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                  {/* データ点マーカー */}
                  {s.points.map((pt, i) => (
                    <circle
                      key={`${s.protocol}-${buckets[i].start}`}
                      cx={toX(i, n)}
                      cy={toY(pt, maxY)}
                      r={3}
                      fill={color}
                      fillOpacity={0.9}
                    >
                      <title>
                        {`${s.protocol}: ${pt.toFixed(1)}% (${buckets[i].label})`}
                      </title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </g>
        </svg>

        {/* 凡例 */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-zinc-300">
          {series.map((s, si) => {
            const color =
              SERIES_COLORS[si % SERIES_COLORS.length] ?? FALLBACK_COLOR;
            return (
              <span key={s.protocol} className="flex items-center gap-1">
                <svg width="16" height="4" aria-hidden="true">
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke={color}
                    strokeWidth="2"
                  />
                </svg>
                {s.protocol}
              </span>
            );
          })}
        </div>

        {/* sr-only table for accessibility */}
        <table className="sr-only">
          <caption>{tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t("usage.tableBucket")}</th>
              {series.map((s) => (
                <th key={s.protocol} scope="col">
                  {s.protocol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buckets.map((b, i) => (
              <tr key={b.start}>
                <td>{b.label}</td>
                {series.map((s) => (
                  <td key={s.protocol}>{s.points[i]?.toFixed(1) ?? "0.0"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);
