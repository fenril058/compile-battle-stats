import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StrengthModel } from "../utils/logic";
import { Strength } from "./Strength";

const baseModel: StrengthModel = {
  theta: { FIRE: 1.5, WATER: 0.2, SPIRIT: -1.2 },
  firstAdvantage: 0,
  games: 10,
  iterations: 100,
  converged: true,
};

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
});
