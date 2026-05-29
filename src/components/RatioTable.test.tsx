import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RATIO_SETS } from "../config";
import type { Protocol } from "../types";
import { RatioTable } from "./RatioTable";

const ratios = RATIO_SETS.S1;

describe("RatioTable", () => {
  it("見出し『レシオ表』を描画する", () => {
    render(<RatioTable protocols={["FIRE"]} ratios={ratios} />);
    expect(screen.getByText("レシオ表")).toBeInTheDocument();
  });

  it("スコアごとにグルーピングし、降順で並べる", () => {
    // S1: FIRE=5, DEATH=3, LIFE=2, LIGHT=1, METAL=0
    const protocols: Protocol[] = ["LIGHT", "FIRE", "METAL", "DEATH", "LIFE"];
    const { container } = render(
      <RatioTable protocols={protocols} ratios={ratios} />,
    );

    const lines = Array.from(
      container.querySelectorAll(".text-left > div"),
    ).map((el) => el.textContent);

    expect(lines).toEqual([
      "5点: FIRE",
      "3点: DEATH",
      "2点: LIFE",
      "1点: LIGHT",
      "0点: METAL",
    ]);
  });

  it("同スコアのプロトコルは comma 区切りでまとめる", () => {
    // S1: FIRE=5, DARKNESS=5
    render(<RatioTable protocols={["FIRE", "DARKNESS"]} ratios={ratios} />);
    expect(screen.getByText("5点: FIRE, DARKNESS")).toBeInTheDocument();
  });

  it("ratios に存在しないプロトコルはスキップする", () => {
    render(
      <RatioTable
        protocols={["FIRE", "NOPE" as unknown as Protocol]}
        ratios={ratios}
      />,
    );
    expect(screen.getByText("5点: FIRE")).toBeInTheDocument();
    expect(screen.queryByText(/NOPE/)).not.toBeInTheDocument();
  });
});
