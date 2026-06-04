import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ArchetypeMatchup } from "../utils/logic";
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
