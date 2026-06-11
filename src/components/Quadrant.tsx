import React, { useMemo } from "react";
import { ABBR } from "../config";
import { useT } from "../i18n";
import { quadrantPoints } from "../lib/logic";
import type { SideStats } from "../types";

type QuadrantProps = {
  single: SideStats;
  title: string;
  minGames?: number;
};

// SVG layout constants
const SVG_WIDTH = 480;
// 表示上限幅。スマホでは width="100%" でコンテナ幅まで縮むが、PC では
// この上限まで拡大して小さく見えないようにする（viewBox 基準で等比拡大）。
const MAX_DISPLAY_WIDTH = 720;
const MARGIN = { top: 20, right: 20, bottom: 48, left: 52 };
const PLOT_W = SVG_WIDTH - MARGIN.left - MARGIN.right;
// プロット高さの基準値（旧 PLOT_H = 320 - 20 - 48 = 252）。
// 点数が多い場合は動的に拡大するため、ここでは基準値のみ定義する。
const BASE_PLOT_H = 252;

/** pickRate (x) を SVG 座標に変換する。maxPickRate に少し余白を加える。 */
const toX = (pickRate: number, maxPickRate: number): number => {
  const domainMax = Math.max(maxPickRate * 1.1, 1);
  return (pickRate / domainMax) * PLOT_W;
};

/** 勝率 (y, 0..100) を SVG 座標に変換する（上が 100）。plotH を引数で受け取る。 */
const toY = (winRate: number, plotH: number): number =>
  ((100 - winRate) / 100) * plotH;

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

    // ラベルの重なり回避: 点を y 昇順に並べ、最小間隔を確保して縦にずらす。
    // labelX は各点の真横に固定（水平移動なし）。引き出し線は縦方向のみになり追いやすい。
    const LABEL_GAP = 9;

    // プロット高さを点数に応じて動的化する。
    // 全ラベル（LABEL_GAP 間隔）が必ず収まる高さを確保することで、
    // 点数が多い（29点以上）場合にラベルが上端（y<0）へはみ出すのを防ぐ。
    const plotH = Math.max(BASE_PLOT_H, points.length * LABEL_GAP + 12);
    const svgHeight = plotH + MARGIN.top + MARGIN.bottom;

    const refY = toY(50, plotH);
    const refX = toX(avgPickRate, maxPickRate);

    // toX 内部と同じ x ドメイン上限。X 軸目盛りの生成に使う。
    const domainMax = Math.max(maxPickRate * 1.1, 1);
    // X 軸（ピック率）の目盛り: 5% 刻み。罫線＋目盛り＋ラベルを描く。
    const xTicks: number[] = [];
    for (let v = 0; v <= domainMax + 1e-9; v += 5) xTicks.push(v);

    const placed = points
      .map((pt) => {
        const cx = toX(pt.pickRate, maxPickRate);
        const cy = toY(pt.p, plotH);
        const r = radius(pt.g);
        const abbr = ABBR[pt.n as keyof typeof ABBR] ?? pt.n.slice(0, 3);
        // 右に出すと枠外になりそうな点は左にラベルを置く。
        const rightSide = cx <= PLOT_W - 40;
        return {
          pt,
          cx,
          cy,
          r,
          abbr,
          rightSide,
          labelY: cy,
          labelX: 0,
          moved: false,
        };
      })
      .sort((a, b) => a.cy - b.cy);
    // 前方パス: 下方向へ押し下げて最小間隔を確保
    let prevY = Number.NEGATIVE_INFINITY;
    for (const p of placed) {
      p.labelY = Math.max(p.cy, prevY + LABEL_GAP);
      prevY = p.labelY;
    }
    // 後方パス: 下端を超えた分を上へ詰めて枠内へ収める
    let limit = plotH;
    for (let i = placed.length - 1; i >= 0; i -= 1) {
      if (placed[i].labelY > limit) placed[i].labelY = limit;
      limit = placed[i].labelY - LABEL_GAP;
    }
    // 安全クランプ: 動的高さにより通常は発火しないが、万一 y<0 になるケースを防ぐ。
    for (const p of placed) {
      p.labelY = Math.max(0, p.labelY);
    }

    // ラベルを各点の真横に固定。縦にずれた場合のみ引き出し線を描く。
    for (const p of placed) {
      p.labelX = p.rightSide ? p.cx + p.r + 3 : p.cx - p.r - 3;
      p.moved = Math.abs(p.labelY - p.cy) > 1.5;
    }

    const svgAriaLabel = t("quadrant.svgAriaLabel", { title });
    const tableCaption = t("quadrant.tableCaption", { title });

    return (
      <div>
        {/* SVG scatter chart */}
        <svg
          role="img"
          aria-label={svgAriaLabel}
          viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
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
              height={plotH}
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
              y2={plotH}
              stroke="#71717a"
              strokeWidth={1}
              strokeDasharray="4 3"
            />

            {/* Y axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={plotH}
              stroke="#52525b"
              strokeWidth={1}
            />
            {/* X axis */}
            <line
              x1={0}
              y1={plotH}
              x2={PLOT_W}
              y2={plotH}
              stroke="#52525b"
              strokeWidth={1}
            />

            {/* Y axis ticks + gridlines: 0, 25, 50, 75, 100 */}
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v} transform={`translate(0,${toY(v, plotH)})`}>
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
                    y2={plotH}
                    stroke="#3f3f46"
                    strokeWidth={0.5}
                  />
                  <line
                    x1={x}
                    y1={plotH}
                    x2={x}
                    y2={plotH + 4}
                    stroke="#52525b"
                  />
                  <text
                    x={x}
                    y={plotH + 14}
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
              transform={`rotate(-90) translate(${-plotH / 2},${-MARGIN.left + 12})`}
              textAnchor="middle"
              fontSize={10}
              fill="#a1a1aa"
            >
              {t("quadrant.yAxis")}
            </text>

            {/* X axis label */}
            <text
              x={PLOT_W / 2}
              y={plotH + MARGIN.bottom - 6}
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
            {placed.map(
              ({ pt, cx, cy, r, abbr, rightSide, labelY, labelX, moved }) => {
                const labelAnchor = rightSide ? "start" : "end";
                // 引き出し線は円の縁から出す（中心からだと円に埋もれる）。
                const lineX1 = rightSide ? cx + r : cx - r;
                return (
                  <g key={pt.n}>
                    <title>
                      {`${pt.n}: ${t("quadrant.tablePickRate")} ${pt.pickRate.toFixed(1)}, ${t("quadrant.tableWinRate")} ${pt.p.toFixed(1)}, ${t("quadrant.tableGames")} ${pt.g}`}
                    </title>
                    {moved && (
                      <line
                        x1={lineX1}
                        y1={cy}
                        x2={labelX}
                        y2={labelY}
                        stroke="#71717a"
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
              },
            )}
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
