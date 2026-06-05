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
// 表示上限幅。スマホでは width="100%" でコンテナ幅まで縮むが、PC では
// この上限まで拡大して小さく見えないようにする（viewBox 基準で等比拡大）。
const MAX_DISPLAY_WIDTH = 720;
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

    const totalMatches = useMemo(
      () =>
        Math.round(
          Object.values(single).reduce((acc, { g }) => acc + g, 0) / 6,
        ),
      [single],
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

    // toX 内部と同じ x ドメイン上限。X 軸目盛りの生成に使う。
    const domainMax = Math.max(maxPickRate * 1.1, 1);
    // X 軸（ピック率）の目盛り: 5% 刻み。罫線＋目盛り＋ラベルを描く。
    const xTicks: number[] = [];
    for (let v = 0; v <= domainMax + 1e-9; v += 5) xTicks.push(v);

    // ラベルの重なり回避: 点を y 昇順に並べ、最小間隔を確保して縦にずらす。
    // 元の点位置からずれたラベルには引き出し線を描く（点が密集しても読める）。
    const LABEL_GAP = 9;
    const placed = points
      .map((pt) => {
        const cx = toX(pt.pickRate, maxPickRate);
        const cy = toY(pt.p);
        const r = radius(pt.g);
        const abbr = ABBR[pt.n as keyof typeof ABBR] ?? pt.n.slice(0, 3);
        // 右に出すと枠外になりそうな点は左にラベルを置く。
        const rightSide = cx <= PLOT_W - 40;
        return { pt, cx, cy, r, abbr, rightSide, labelY: cy };
      })
      .sort((a, b) => a.cy - b.cy);
    // 前方パス: 下方向へ押し下げて最小間隔を確保
    let prevY = Number.NEGATIVE_INFINITY;
    for (const p of placed) {
      p.labelY = Math.max(p.cy, prevY + LABEL_GAP);
      prevY = p.labelY;
    }
    // 後方パス: 下端を超えた分を上へ詰めて枠内へ収める
    let limit = PLOT_H;
    for (let i = placed.length - 1; i >= 0; i -= 1) {
      if (placed[i].labelY > limit) placed[i].labelY = limit;
      limit = placed[i].labelY - LABEL_GAP;
    }

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

            {/* Y axis ticks + gridlines: 0, 25, 50, 75, 100 */}
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v} transform={`translate(0,${toY(v)})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={PLOT_W}
                  y2={0}
                  stroke="#3f3f46"
                  strokeWidth={0.5}
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

            {/* X axis ticks + gridlines: 5% ごと（ピック率） */}
            {xTicks.map((v) => {
              const x = toX(v, maxPickRate);
              return (
                <g key={`xt-${v}`}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={PLOT_H}
                    stroke="#3f3f46"
                    strokeWidth={0.5}
                  />
                  <line
                    x1={x}
                    y1={PLOT_H}
                    x2={x}
                    y2={PLOT_H + 4}
                    stroke="#52525b"
                  />
                  <text
                    x={x}
                    y={PLOT_H + 14}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#a1a1aa"
                  >
                    {v}
                  </text>
                </g>
              );
            })}

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

            {/* Total matches annotation – top-right corner of plot area */}
            <text
              x={PLOT_W - 4}
              y={12}
              textAnchor="end"
              fontSize={9}
              fill="#71717a"
            >
              {t("quadrant.totalGames", { n: totalMatches })}
            </text>

            {/* Data points（ラベルは重なり回避済み・ずれた場合は引き出し線） */}
            {placed.map(({ pt, cx, cy, r, abbr, rightSide, labelY }) => {
              const labelX = rightSide ? cx + r + 3 : cx - r - 3;
              const labelAnchor = rightSide ? "start" : "end";
              // ラベルが点から縦に離れたら引き出し線を描く。
              const moved = Math.abs(labelY - cy) > 1.5;
              return (
                <g key={pt.n}>
                  <title>
                    {`${pt.n}: ${t("quadrant.tablePickRate")} ${pt.pickRate.toFixed(1)}, ${t("quadrant.tableWinRate")} ${pt.p.toFixed(1)}, ${t("quadrant.tableGames")} ${pt.g}`}
                  </title>
                  {moved && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={labelX}
                      y2={labelY}
                      stroke="#52525b"
                      strokeWidth={0.5}
                    />
                  )}
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
                    x={labelX}
                    y={labelY}
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
        <p className="text-[10px] text-zinc-500 mt-1">
          {t("quadrant.sizeNote")}
        </p>

        {/* sr-only table for accessibility – div wrapper prevents caption overflow */}
        <div className="sr-only">
          <table>
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
      </div>
    );
  },
);
