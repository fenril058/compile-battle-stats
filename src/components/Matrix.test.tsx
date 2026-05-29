import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MatrixData, Protocol } from "../types";
import { Matrix } from "./Matrix";

const protocols: Protocol[] = ["FIRE", "WATER"];

// FIRE vs WATER = 75%, WATER vs FIRE = 25%, 対角は null
const matrix: MatrixData = {
  FIRE: { FIRE: null, WATER: 75 },
  WATER: { FIRE: 25, WATER: null },
};

describe("Matrix", () => {
  it("protocols が空ならテーブルを描画しない（プレースホルダのみ）", () => {
    const { container } = render(
      <Matrix t="マトリクス" m={{}} bg="bg-zinc-900" protocols={[]} />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/マトリクス/)).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("見出しに最小試合数を含めて描画する", () => {
    render(
      <Matrix
        t="マトリクス"
        m={matrix}
        bg="bg-zinc-900"
        protocols={protocols}
      />,
    );
    expect(screen.getByText(/マトリクス（3 戦以上）/)).toBeInTheDocument();
  });

  it("ABBR でヘッダーを描画する", () => {
    render(<Matrix t="m" m={matrix} bg="bg-zinc-900" protocols={protocols} />);
    // FIRE→FIR, WATER→WAT（列ヘッダ + 行ヘッダで複数登場）
    expect(screen.getAllByText("FIR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("WAT").length).toBeGreaterThan(0);
  });

  it("数値セルは整数で、null セルは『–』で描画する", () => {
    render(<Matrix t="m" m={matrix} bg="bg-zinc-900" protocols={protocols} />);
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    // 対角の null セルが 2 つ
    expect(screen.getAllByText("–")).toHaveLength(2);
  });
});
