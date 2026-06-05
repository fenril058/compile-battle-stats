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

  describe("variant='residual'（連続グラデーション）", () => {
    // 残差: +30(強い正) / -25(強い負) / +5(小さい正) / null
    const residual: MatrixData = {
      FIRE: { FIRE: null, WATER: 30 },
      WATER: { FIRE: -25, WATER: 5 },
    };

    it("符号付きで表示し、正は緑・負は赤を intensity に応じて連続配色する", () => {
      render(
        <Matrix
          title="m"
          m={residual}
          bg="bg-zinc-900"
          protocols={protocols}
          variant="residual"
        />,
      );

      // +30 → 最大強度の緑（intensity=1, alpha=0.90 → jsdom は 0.9 に正規化）
      const pos = screen.getByText("+30");
      expect(pos.style.backgroundColor).toBe("rgba(21, 128, 61, 0.9)");

      // -25 → 強度 25/30 ≈ 0.833 の赤（alpha=0.77）
      const neg = screen.getByText("-25");
      expect(neg.style.backgroundColor).toBe("rgba(185, 28, 28, 0.77)");

      // +5 → 強度 5/30 ≈ 0.167 の薄い緑（alpha=0.23）
      const small = screen.getByText("+5");
      expect(small.style.backgroundColor).toBe("rgba(21, 128, 61, 0.23)");

      // null セルは従来どおり『–』（1 つ）
      expect(screen.getAllByText("–")).toHaveLength(1);
    });

    it("色の強度は |残差| が大きいほど高い（大 > 小）", () => {
      render(
        <Matrix
          title="m"
          m={residual}
          bg="bg-zinc-900"
          protocols={protocols}
          variant="residual"
        />,
      );
      const largeAlpha = Number.parseFloat(
        (screen.getByText("+30").style.backgroundColor.match(/[\d.]+\)$/) ?? [
          "0",
        ])[0],
      );
      const smallAlpha = Number.parseFloat(
        (screen.getByText("+5").style.backgroundColor.match(/[\d.]+\)$/) ?? [
          "0",
        ])[0],
      );
      expect(largeAlpha).toBeGreaterThan(smallAlpha);
    });

    it("RESIDUAL_CLAMP_PP (30pp) を超えた値はクランプされ最大強度と同じ alpha になる", () => {
      const overClamp: MatrixData = {
        FIRE: { FIRE: null, WATER: 60 }, // 30pp 超え
        WATER: { FIRE: 30, WATER: null },
      };
      render(
        <Matrix
          title="m"
          m={overClamp}
          bg="bg-zinc-900"
          protocols={protocols}
          variant="residual"
        />,
      );
      const over = screen.getByText("+60");
      const at = screen.getByText("+30");
      expect(over.style.backgroundColor).toBe(at.style.backgroundColor);
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
