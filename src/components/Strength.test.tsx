import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StrengthModel } from "../lib/logic";
import { Strength } from "./Strength";

const baseModel: StrengthModel = {
  theta: { FIRE: 1.5, WATER: 0.2, SPIRIT: -1.2 },
  firstAdvantage: 0,
  games: 10,
  iterations: 100,
  converged: true,
};

const makeSliceModel = (games: number, beta = 0.2): StrengthModel => ({
  theta: { FIRE: 0.5 },
  firstAdvantage: beta,
  games,
  iterations: 50,
  converged: true,
});

describe("Strength", () => {
  it("試合が無ければ『データなし』を表示する", () => {
    render(<Strength model={{ ...baseModel, theta: {}, games: 0 }} />);
    expect(screen.getByText("データなし")).toBeInTheDocument();
  });

  it("θ 降順で各プロトコルを並べる", () => {
    render(<Strength model={baseModel} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText("FIRE")).toBeInTheDocument();
    expect(within(items[1]).getByText("WATER")).toBeInTheDocument();
    expect(within(items[2]).getByText("SPIRIT")).toBeInTheDocument();
  });

  it("β=0 のとき五分デッキの先攻勝率を 50.0% と表示する", () => {
    render(<Strength model={baseModel} />);
    // strength.firstAdvantage に rate=50.0 が補間される
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument();
  });

  describe("スライス別 β 内訳（normalModel / ratioModel）", () => {
    it("normalModel/ratioModel 未指定でも従来表示が壊れない", () => {
      render(<Strength model={baseModel} />);
      // スライス内訳セクションは表示されない
      expect(
        screen.queryByText("先攻有利の内訳（通常戦 / レシオ戦）"),
      ).not.toBeInTheDocument();
      // θ リストは通常通り表示
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("games >= 20 の normalModel を渡すと通常戦の内訳が表示される", () => {
      render(
        <Strength model={baseModel} normalModel={makeSliceModel(30, 0.09)} />,
      );
      expect(
        screen.getByText("先攻有利の内訳（通常戦 / レシオ戦）"),
      ).toBeInTheDocument();
      // 通常戦の行が表示される
      const normalLine = screen.getByText(/通常戦:/);
      expect(normalLine).toBeInTheDocument();
      expect(normalLine.textContent).toMatch(/30試合/);
      // レシオ戦の行は表示されない（ratioModel 未指定）
      expect(screen.queryByText(/レシオ戦:/)).not.toBeInTheDocument();
    });

    it("games >= 20 の ratioModel を渡すとレシオ戦の内訳が表示される", () => {
      render(
        <Strength model={baseModel} ratioModel={makeSliceModel(45, 0.2)} />,
      );
      expect(
        screen.getByText("先攻有利の内訳（通常戦 / レシオ戦）"),
      ).toBeInTheDocument();
      const ratioLine = screen.getByText(/レシオ戦:/);
      expect(ratioLine).toBeInTheDocument();
      expect(ratioLine.textContent).toMatch(/45試合/);
      // 通常戦の行は表示されない（normalModel 未指定）
      expect(screen.queryByText(/通常戦:/)).not.toBeInTheDocument();
    });

    it("両方 games >= 20 なら両スライスが表示される", () => {
      render(
        <Strength
          model={baseModel}
          normalModel={makeSliceModel(123, 0.09)}
          ratioModel={makeSliceModel(45, 0.2)}
        />,
      );
      expect(
        screen.getByText("先攻有利の内訳（通常戦 / レシオ戦）"),
      ).toBeInTheDocument();
      expect(screen.getByText(/通常戦:/)).toBeInTheDocument();
      expect(screen.getByText(/レシオ戦:/)).toBeInTheDocument();
    });

    it("normalModel の games < 20 なら通常戦の行を表示しない", () => {
      render(<Strength model={baseModel} normalModel={makeSliceModel(5)} />);
      expect(
        screen.queryByText("先攻有利の内訳（通常戦 / レシオ戦）"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/通常戦:/)).not.toBeInTheDocument();
    });

    it("ratioModel の games < 20 なら内訳セクション自体を表示しない", () => {
      render(<Strength model={baseModel} ratioModel={makeSliceModel(10)} />);
      expect(
        screen.queryByText("先攻有利の内訳（通常戦 / レシオ戦）"),
      ).not.toBeInTheDocument();
    });

    it("両スライスとも games < 20 なら何も出さない", () => {
      render(
        <Strength
          model={baseModel}
          normalModel={makeSliceModel(5)}
          ratioModel={makeSliceModel(10)}
        />,
      );
      expect(
        screen.queryByText("先攻有利の内訳（通常戦 / レシオ戦）"),
      ).not.toBeInTheDocument();
    });

    it("β の符号を + / − 付きで表示する", () => {
      render(
        <Strength
          model={baseModel}
          normalModel={makeSliceModel(30, 0.09)}
          ratioModel={makeSliceModel(25, -0.05)}
        />,
      );
      expect(screen.getByText(/通常戦:/).textContent).toMatch(/β = \+0\.09/);
      expect(screen.getByText(/レシオ戦:/).textContent).toMatch(/β = −0\.05/);
    });
  });
});
