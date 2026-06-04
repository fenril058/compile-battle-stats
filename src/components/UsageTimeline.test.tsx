import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { UsageTimeline as UsageTimelineData } from "../utils/logic";
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
});
