import React, { useMemo } from "react";
import { ABBR } from "../config";
import { useT } from "../i18n";
import type { SideStats } from "../types";
import { quadrantPoints } from "../utils/logic";

type QuadrantProps = {
  single: SideStats;
  title: string;
  minGames?: number;
};

// SVG layout constants
const SVG_WIDTH = 480;
const SVG_HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 48, left: 52 };
const PLOT_W = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

/** pickRate (x) を SVG 座標に変換する。maxPickRate に少し余白を加える。 */
const toX = (pickRate: number, maxPickRate: number): number => {
  const domainMax = Math.max(maxPickRate * 1.1, 1);
  return (pickRate / domainMax) * PLOT_W;
};

/** 勝率 (y, 0..100) を SVG 座標に変換する（上が 100）。 */
const toY = (winRate: number): number => ((100 - winRate) / 100) * PLOT_H;

/** g に応じて半径を 3〜7 にクランプする。 */
const radius = (g: number): number => Math.min(7, Math.max(3, 3 + g * 0.15));

export const Quadrant: React.FC<QuadrantProps> = React.memo(
  ({ single, title, minGames = 1 }) => {
    const { t } = useT();

    const points = useMemo(
      () => quadrantPoints(single, minGames),
      [single, minGames],
    );

    if (points.length === 0) {
      return (
        <p className="text-sm text-zinc-400 text-center py-12">
          {t("common.noData")}
        </p>
      );
    }

    const maxPickRate = Math.max(...points.map((p) => p.pickRate));
    const avgPickRate =
      points.reduce((acc, p) => acc + p.pickRate, 0) / points.length;

    const refY = toY(50);
    const refX = toX(avgPickRate, maxPickRate);

    const svgAriaLabel = t("quadrant.svgAriaLabel", { title });
    const tableCaption = t("quadrant.tableCaption", { title });

    return (
      <div>
        {/* SVG scatter chart */}
        <svg
          role="img"
          aria-label={svgAriaLabel}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width="100%"
          style={{ display: "block", maxWidth: SVG_WIDTH }}
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

            {/* Reference line: y = 50% (horizontal) */}
            <line
              x1={0}
              y1={refY}
              x2={PLOT_W}
              y2={refY}
              stroke="#71717a"
              strokeWidth={1}
              strokeDasharray="4 3"
            />

            {/* Reference line: x = average pickRate (vertical) */}
            <line
              x1={refX}
              y1={0}
              x2={refX}
              y2={PLOT_H}
              stroke="#71717a"
              strokeWidth={1}
              strokeDasharray="4 3"
            />

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

            {/* Y axis ticks: 0, 25, 50, 75, 100 */}
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v} transform={`translate(0,${toY(v)})`}>
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

            {/* Y axis label */}
            <text
              transform={`rotate(-90) translate(${-PLOT_H / 2},${-MARGIN.left + 12})`}
              textAnchor="middle"
              fontSize={10}
              fill="#a1a1aa"
            >
              {t("quadrant.yAxis")}
            </text>

            {/* X axis label */}
            <text
              x={PLOT_W / 2}
              y={PLOT_H + MARGIN.bottom - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#a1a1aa"
            >
              {t("quadrant.xAxis")}
            </text>

            {/* Data points */}
            {points.map((pt) => {
              const cx = toX(pt.pickRate, maxPickRate);
              const cy = toY(pt.p);
              const r = radius(pt.g);
              const abbr = ABBR[pt.n as keyof typeof ABBR] ?? pt.n.slice(0, 3);

              // Choose label position to keep it inside the SVG area
              const labelDx = cx > PLOT_W - 30 ? -r - 2 : r + 2;
              const labelAnchor = cx > PLOT_W - 30 ? "end" : "start";

              return (
                <g key={pt.n}>
                  <title>
                    {`${pt.n}: ${t("quadrant.tablePickRate")} ${pt.pickRate.toFixed(1)}, ${t("quadrant.tableWinRate")} ${pt.p.toFixed(1)}, ${t("quadrant.tableGames")} ${pt.g}`}
                  </title>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="#60a5fa"
                    fillOpacity={0.8}
                    stroke="#1d4ed8"
                    strokeWidth={0.5}
                  />
                  <text
                    x={cx + labelDx}
                    y={cy}
                    dominantBaseline="middle"
                    textAnchor={labelAnchor}
                    fontSize={8}
                    fill="#e4e4e7"
                  >
                    {abbr}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* sr-only table for accessibility */}
        <table className="sr-only">
          <caption>{tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t("quadrant.tableProtocol")}</th>
              <th scope="col">{t("quadrant.tablePickRate")}</th>
              <th scope="col">{t("quadrant.tableWinRate")}</th>
              <th scope="col">{t("quadrant.tableGames")}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((pt) => (
              <tr key={pt.n}>
                <td>{pt.n}</td>
                <td>{pt.pickRate.toFixed(1)}</td>
                <td>{pt.p.toFixed(1)}</td>
                <td>{pt.g}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);
