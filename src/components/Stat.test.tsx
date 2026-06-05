import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StatsResult } from "../types";
import { Stat } from "./Stat";

const baseStats: StatsResult = {
  single: {
    FIRE: { g: 4, w: 3 }, // 75.0%
    WATER: { g: 4, w: 1 }, // 25.0%
  },
  pair: {
    "FIRE · WATER": { g: 6, w: 4 }, // 5戦以上 → 表示
    "FIRE · METAL": { g: 2, w: 2 }, // 5戦未満 → 除外
  },
  trio: {},
  first: {},
  second: {},
};

const renderStat = (m: StatsResult = baseStats) =>
  render(<Stat title="赤" m={m} color="bg-red-900" minPair={5} minTrio={3} />);

describe("Stat", () => {
  it("タイトルと全タブを描画する", () => {
    renderStat();
    expect(screen.getByText("赤")).toBeInTheDocument();
    for (const label of ["単体", "2枚組", "3枚組", "先攻", "後攻"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("既定で single セクションを勝率降順で表示する", () => {
    renderStat();
    expect(
      screen.getByRole("heading", { name: "プロトコル単体勝率" }),
    ).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    // ヘッダー行 + データ2行
    expect(rows).toHaveLength(3);
    // 1位が FIRE(75.0)、2位が WATER(25.0)
    expect(rows[1]).toHaveTextContent("FIRE");
    expect(rows[1]).toHaveTextContent("75.0");
    expect(rows[2]).toHaveTextContent("WATER");
    expect(rows[2]).toHaveTextContent("25.0");
  });

  it("タブを切り替えると pair セクションへ（forest は全件、旧表は minPair フィルタ）", () => {
    renderStat();
    fireEvent.click(screen.getByText("2枚組"));

    // h3 は minGames なし（forest に下限不要なため）
    expect(
      screen.getByRole("heading", {
        name: "プロトコル2枚組勝率",
      }),
    ).toBeInTheDocument();
    // forest: FIRE · WATER・FIRE · METAL ともに表示（Wilson CI 幅で不確かさを表現）
    expect(screen.getAllByText("FIRE · WATER").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FIRE · METAL").length).toBeGreaterThan(0);
    // 旧テーブルは minPair フィルタあり → FIRE · METAL は table 内に出ない
    const table = screen.getByRole("table");
    expect(table).not.toHaveTextContent("FIRE · METAL");
  });

  it("該当データが無ければ『データなし』を表示する", () => {
    renderStat({ ...baseStats, single: {} });
    expect(screen.getByText("データなし")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
