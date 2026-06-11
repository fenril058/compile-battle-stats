import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { UsageTimeline as UsageTimelineData } from "../lib/logic";
import { UsageTimeline } from "./UsageTimeline";

const data: UsageTimelineData = {
  buckets: [
    { label: "2025-01-06", start: 1 },
    { label: "2025-01-13", start: 2 },
  ],
  series: [
    { protocol: "FIRE", points: [50, 40] },
    { protocol: "WATER", points: [30, 20] },
  ],
};

describe("UsageTimeline", () => {
  it("バケットが無ければ『データなし』を表示する", () => {
    render(
      <UsageTimeline data={{ buckets: [], series: [] }} title="使用率推移" />,
    );
    expect(screen.getByText("データなし")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("SVG（role=img）・凡例・sr-only データ表を描画する", () => {
    render(<UsageTimeline data={data} title="使用率推移" />);
    expect(screen.getByRole("img")).toBeInTheDocument();

    // 凡例とデータ表に系列名（FIRE / WATER）が出る
    expect(screen.getAllByText("FIRE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("WATER").length).toBeGreaterThan(0);

    // sr-only データ表に各バケットの行が出る
    const table = screen.getByRole("table");
    expect(within(table).getByText("2025-01-06")).toBeInTheDocument();
    expect(within(table).getByText("2025-01-13")).toBeInTheDocument();
  });

  it("ピック率が小さくても Y 軸に細かい目盛りを描画する（0/25 だけにならない）", () => {
    // 最大 15% → 5 刻みで 0/5/10/15 の目盛りになる（旧実装は 0/25 だけだった）
    const smallData: UsageTimelineData = {
      buckets: [
        { label: "2025-01-06", start: 1 },
        { label: "2025-01-13", start: 2 },
      ],
      series: [
        { protocol: "FIRE", points: [15, 11] },
        { protocol: "WATER", points: [8, 6] },
      ],
    };
    render(<UsageTimeline data={smallData} title="使用率推移" />);
    // Y 目盛りラベル（整数）が 5 刻みで出る
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("15").length).toBeGreaterThan(0);
    // 旧実装の粗い 25 目盛りは出ない
    expect(screen.queryByText("25")).not.toBeInTheDocument();
  });

  it("null（欠測）を含むデータでクラッシュせず、線が分割されること", () => {
    // 3 バケット、中間が null（空週）
    const gapData: UsageTimelineData = {
      buckets: [
        { label: "2025-01-06", start: 1 },
        { label: "2025-01-13", start: 2 },
        { label: "2025-01-20", start: 3 },
      ],
      series: [
        { protocol: "FIRE", points: [50, null, 40] },
        { protocol: "WATER", points: [30, null, 20] },
      ],
    };
    const { container } = render(
      <UsageTimeline data={gapData} title="使用率推移" />,
    );
    // クラッシュしない（SVG が描画される）
    expect(screen.getByRole("img")).toBeInTheDocument();
    // null を挟んだため各系列の path が 2 本（前半・後半）に分かれる
    const paths = container.querySelectorAll("path");
    // 少なくとも FIRE の 2 本 + WATER の 2 本 = 4 本
    expect(paths.length).toBeGreaterThanOrEqual(4);
    // sr-only テーブルの空週セルは "-" 表示
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("-").length).toBeGreaterThan(0);
  });
});
