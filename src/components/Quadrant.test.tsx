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

  it("X 軸に 5% 刻みの目盛りラベルを描画する", () => {
    render(<Quadrant single={single} title="散布図" />);
    // 5, 10 は X 目盛り専用の値（Y 目盛りは 0/25/50/75/100）
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("総試合数を n = （プロトコル出現数 / 6）で表示する", () => {
    // 1 試合 = 先攻3 + 後攻3 = 6 プロトコル出現。出現数の合計を 6 で割る。
    const oneMatch: SideStats = {
      FIRE: { g: 2, w: 1 },
      WATER: { g: 2, w: 1 },
      METAL: { g: 2, w: 1 },
    };
    render(<Quadrant single={oneMatch} title="散布図" />);
    expect(screen.getByText("n = 1 試合")).toBeInTheDocument();
    expect(screen.getByText("● の大きさ = ピック数")).toBeInTheDocument();
  });

  it("点が重なってもすべてのラベル（略号）を描画する", () => {
    // 3 点とも pickRate=33.3 / 勝率=60 で完全に重なる
    const overlap: SideStats = {
      FIRE: { g: 5, w: 3 },
      WATER: { g: 5, w: 3 },
      METAL: { g: 5, w: 3 },
    };
    render(<Quadrant single={overlap} title="散布図" />);
    expect(screen.getByText("FIR")).toBeInTheDocument();
    expect(screen.getByText("WAT")).toBeInTheDocument();
    expect(screen.getByText("MET")).toBeInTheDocument();
  });

  it("低ピック率の密集クラスタでは縦方向に分離し、ラベルは各点の真横に配置する", () => {
    // FIRE は高ピック（クラスタ外）。WATER/METAL/LIGHT は低ピック・同勝率(33.3%)で
    // 縦に重なる密集クラスタ。
    const cluster: SideStats = {
      FIRE: { g: 60, w: 30 },
      WATER: { g: 9, w: 3 },
      METAL: { g: 6, w: 2 },
      LIGHT: { g: 3, w: 1 },
    };
    render(<Quadrant single={cluster} title="散布図" />);

    const met = screen.getByText("MET");
    const lig = screen.getByText("LIG");

    // 縦方向には最小間隔以上離れて重ならない。
    const yMet = Number(met.getAttribute("y"));
    const yLig = Number(lig.getAttribute("y"));
    expect(Math.abs(yMet - yLig)).toBeGreaterThanOrEqual(8);

    // 各ラベルは共通列へ整列せず、それぞれ自点の横に個別配置される（x が異なる）。
    expect(met.getAttribute("x")).not.toBe(lig.getAttribute("x"));
  });
});
