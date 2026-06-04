import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SideStats } from "../types";
import { Quadrant } from "./Quadrant";

const single: SideStats = {
  FIRE: { g: 6, w: 3 }, // pickRate 60, 勝率 50
  WATER: { g: 4, w: 1 }, // pickRate 40, 勝率 25
};

describe("Quadrant", () => {
  it("データが無ければ『データなし』を表示する", () => {
    render(<Quadrant single={{}} title="散布図" />);
    expect(screen.getByText("データなし")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("SVG（role=img）と各プロトコルの sr-only データ行を描画する", () => {
    render(<Quadrant single={single} title="散布図" />);
    expect(screen.getByRole("img")).toBeInTheDocument();

    // sr-only データ表に各プロトコルの行（フルネーム）が出る
    const table = screen.getByRole("table");
    expect(within(table).getByText("FIRE")).toBeInTheDocument();
    expect(within(table).getByText("WATER")).toBeInTheDocument();
  });
});
