import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Match, Trio } from "../types";
import { type ArchetypeMatchup, archetypeMatchup } from "../utils/logic";
import { Archetypes } from "./Archetypes";

const data: ArchetypeMatchup = {
  archetypes: [
    { id: 0, label: "FIRE/METAL/WATER", protocols: ["FIRE", "METAL", "WATER"] },
    {
      id: 1,
      label: "LIFE/SPEED/SPIRIT",
      protocols: ["LIFE", "SPEED", "SPIRIT"],
    },
  ],
  // arch0 が arch1 に 100% 勝ち、逆は 0%、対角は null
  matrix: [
    [null, 100],
    [0, null],
  ],
  games: [
    [0, 5],
    [5, 0],
  ],
};

describe("Archetypes", () => {
  it("アーキタイプが無ければ『データなし』を表示する", () => {
    render(<Archetypes data={{ archetypes: [], matrix: [], games: [] }} />);
    expect(screen.getByText("データなし")).toBeInTheDocument();
  });

  it("凡例（ABBR 構成）と相性ヒートマップのセルを描画する", () => {
    render(<Archetypes data={data} />);

    // 凡例: A1 / A2 と ABBR 構成
    expect(screen.getByText(/FIR \/ MET \/ WAT/)).toBeInTheDocument();

    // ヒートマップのセル（100 / 0）と対角の null（–）
    const table = screen.getByRole("table");
    expect(within(table).getByText("100")).toBeInTheDocument();
    expect(within(table).getByText("0")).toBeInTheDocument();
    expect(within(table).getAllByText("–")).toHaveLength(2);
  });
});

// issue #149: クラスタ数が極端な場合（1 / 2 / 多数）の表示が破綻しないことを、
// 実ロジック archetypeMatchup に偏らせたデータを流して決定的に検証する。
describe("Archetypes（クラスタ数の境界 / issue #149）", () => {
  const mk = (
    first: Trio,
    second: Trio,
    winner: "FIRST" | "SECOND" = "FIRST",
  ): Match => ({
    id: `m-${Math.random()}`,
    first,
    second,
    winner,
    ratio: false,
    createdAt: 0,
  });

  // 9 個の互いに素な trio（プロトコルが重複しない＝それぞれ独立クラスタになる）
  const TRIOS: Trio[] = [
    ["DARKNESS", "FIRE", "PSYCHIC"],
    ["DEATH", "GRAVITY", "WATER"],
    ["LIFE", "PLAGUE", "LIGHT"],
    ["SPEED", "SPIRIT", "METAL"],
    ["HATE", "LOVE", "APATHY"],
    ["LUCK", "WAR", "COURAGE"],
    ["TIME", "CLARITY", "FEAR"],
    ["CORRUPTION", "SMOKE", "CHAOS"],
    ["MIRROR", "ICE", "PEACE"],
  ];

  const repeat = (m: Match, n: number): Match[] =>
    Array.from({ length: n }, () => m);

  it("1 クラスタ: 自己対戦のみでも 1×1 表が破綻しない", () => {
    // 単一 trio を繰り返すと 3 プロトコルが 1 コミュニティに凝集する
    const matches = repeat(mk(TRIOS[0], TRIOS[0]), 5);
    const data = archetypeMatchup(matches);

    expect(data.archetypes).toHaveLength(1);
    // 対角セルは同アーキ対戦数に関わらず常に null（A1 vs A1 は相性として無意味）
    expect(data.matrix[0][0]).toBeNull();

    render(<Archetypes data={data} />);
    // 凡例は 1 件、表は描画され対角セルは – で出る（クラッシュしない）
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("2 クラスタ: 互いに素な 2 trio が 2 アーキタイプとして相性を持つ", () => {
    const matches = repeat(mk(TRIOS[0], TRIOS[1]), 5);
    const data = archetypeMatchup(matches);

    expect(data.archetypes).toHaveLength(2);
    // 異アーキタイプ間は両視点が埋まる（null でない）
    expect(data.matrix[0][1]).not.toBeNull();
    expect(data.matrix[1][0]).not.toBeNull();

    render(<Archetypes data={data} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("多数クラスタ: 9 アーキタイプでも凡例がスクロール可能で表が描画される", () => {
    const matches = TRIOS.flatMap((t) => repeat(mk(t, t), 3));
    const data = archetypeMatchup(matches);

    expect(data.archetypes).toHaveLength(9);
    // 全アーキタイプの対角セル（Ai vs Ai）が null であること
    for (let i = 0; i < 9; i++) {
      expect(data.matrix[i][i]).toBeNull();
    }

    render(<Archetypes data={data} />);
    // 凡例は 9 件で、はみ出しを抑えるスクロールコンテナになっている
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
    const legend = screen.getByRole("list");
    expect(legend.className).toContain("max-h-40");
    expect(legend.className).toContain("overflow-y-auto");
    // 9 アーキタイプ + 隅セルで列ヘッダは 10 個
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader")).toHaveLength(10);
  });
});
