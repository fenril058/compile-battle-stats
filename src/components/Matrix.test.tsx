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
      <Matrix title="マトリクス" m={{}} bg="bg-zinc-900" protocols={[]} />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/マトリクス/)).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("見出しに最小試合数を含めて描画する", () => {
    render(
      <Matrix
        title="マトリクス"
        m={matrix}
        bg="bg-zinc-900"
        protocols={protocols}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /マトリクス（3 戦以上）/ }),
    ).toBeInTheDocument();
  });

  it("ABBR でヘッダーを描画する", () => {
    render(
      <Matrix title="m" m={matrix} bg="bg-zinc-900" protocols={protocols} />,
    );
    // FIRE→FIR, WATER→WAT（列ヘッダ + 行ヘッダで複数登場）
    expect(screen.getAllByText("FIR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("WAT").length).toBeGreaterThan(0);
  });

  it("数値セルは整数で、null セルは『–』で描画する", () => {
    render(
      <Matrix title="m" m={matrix} bg="bg-zinc-900" protocols={protocols} />,
    );
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    // 対角の null セルが 2 つ
    expect(screen.getAllByText("–")).toHaveLength(2);
  });

  describe("variant='residual'（0中心の発散表示）", () => {
    // 残差: +30(強い正) / -25(強い負) / +5(微小=中立) / null
    const residual: MatrixData = {
      FIRE: { FIRE: null, WATER: 30 },
      WATER: { FIRE: -25, WATER: 5 },
    };

    it("符号付きで表示し、正は緑・負は赤・±10pp 未満は中立で配色する", () => {
      render(
        <Matrix
          title="m"
          m={residual}
          bg="bg-zinc-900"
          protocols={protocols}
          variant="residual"
        />,
      );

      const pos = screen.getByText("+30");
      expect(pos.className).toContain("bg-green-700/40");

      const neg = screen.getByText("-25");
      expect(neg.className).toContain("bg-red-700/40");

      // +5 は閾値(±10)未満なので中立色
      const neutral = screen.getByText("+5");
      expect(neutral.className).toContain("bg-zinc-700/40");

      // null セルは従来どおり『–』（1 つ）
      expect(screen.getAllByText("–")).toHaveLength(1);
    });

    it("theta を渡すと行ヘッダに θ を符号付きで併記する", () => {
      render(
        <Matrix
          title="m"
          m={residual}
          bg="bg-zinc-900"
          protocols={protocols}
          variant="residual"
          theta={{ FIRE: 0.5, WATER: -0.12 }}
        />,
      );
      expect(screen.getByText("θ = +0.50")).toBeInTheDocument();
      expect(screen.getByText("θ = −0.12")).toBeInTheDocument();
    });
  });
});
