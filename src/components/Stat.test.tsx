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
    "FIRE · WATER": { g: 6, w: 4 }, // スライダーデフォルト（3）以上 → 表示
    "FIRE · METAL": { g: 2, w: 2 }, // スライダーデフォルト（3）未満 → 非表示
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

  it("タブを切り替えると pair セクションへ（スライダーで試合数フィルタ）", () => {
    renderStat();
    fireEvent.click(screen.getByText("2枚組"));

    expect(
      screen.getByRole("heading", {
        name: "プロトコル2枚組勝率",
      }),
    ).toBeInTheDocument();

    // デフォルト（3試合）: FIRE · WATER (6試合) は表示、FIRE · METAL (2試合) は非表示
    expect(screen.getAllByText("FIRE · WATER").length).toBeGreaterThan(0);
    expect(screen.queryByText("FIRE · METAL")).not.toBeInTheDocument();

    // スライダーを 1 に下げると FIRE · METAL も forest に現れる
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "1" } });
    expect(screen.getAllByText("FIRE · METAL").length).toBeGreaterThan(0);

    // 旧テーブルはスライダーに関係なく minPair フィルタ（5戦以上）→ FIRE · METAL は非表示
    const table = screen.getByRole("table");
    expect(table).not.toHaveTextContent("FIRE · METAL");
  });

  it("全ペアの試合数がデフォルト下限未満でも forest とスライダーを描画する", () => {
    // 全ペアが 2 試合（maxGames=2 < デフォルト minGames=3）。
    // クランプが無いと forest が空になり『データなし』表示＋スライダー消滅で復帰不能。
    renderStat({
      ...baseStats,
      pair: {
        "FIRE · WATER": { g: 2, w: 1 },
        "FIRE · METAL": { g: 2, w: 2 },
      },
    });
    fireEvent.click(screen.getByText("2枚組"));

    // 『データなし』ではなく実データとスライダーが描画される
    expect(screen.queryByText("データなし")).not.toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getAllByText("FIRE · WATER").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FIRE · METAL").length).toBeGreaterThan(0);
  });

  it("該当データが無ければ『データなし』を表示する", () => {
    renderStat({ ...baseStats, single: {} });
    expect(screen.getByText("データなし")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
