import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TrioRecommendation } from "../lib/logic";
import { TrioRecommend } from "./TrioRecommend";

const mk = (
  protocols: [string, string, string],
  score: number,
  base: number,
  synergy: number,
  pairsWithData: number,
): TrioRecommendation => ({
  protocols,
  label: protocols.join(" · "),
  score,
  base,
  synergy,
  pairsWithData,
  thetaSum: 0,
});

const recommendations = {
  all: [
    mk(["FIRE", "METAL", "WATER"], 88.5, 60, 28.5, 3),
    mk(["LIFE", "SPEED", "SPIRIT"], 32.1, 50, -17.9, 2),
  ],
  ratio: [mk(["LIFE", "SPEED", "WATER"], 55.0, 50, 5, 1)],
};

describe("TrioRecommend", () => {
  it("全体スコープの行を表示する", () => {
    render(<TrioRecommend recommendations={recommendations} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      within(items[0]).getByText("FIRE · METAL · WATER"),
    ).toBeInTheDocument();
    expect(within(items[0]).getByText("88.5%")).toBeInTheDocument();
    expect(
      within(items[1]).getByText("LIFE · SPEED · SPIRIT"),
    ).toBeInTheDocument();
  });

  it("スコープを切り替えると配列が変わる", () => {
    render(<TrioRecommend recommendations={recommendations} />);
    // 既定 = 全体（2件）
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "レシオ" }));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(
      within(items[0]).getByText("LIFE · SPEED · WATER"),
    ).toBeInTheDocument();
  });

  it("空配列のスコープでは『データなし』を表示する", () => {
    render(<TrioRecommend recommendations={{ all: [], ratio: [] }} />);
    expect(screen.getByText("データなし")).toBeInTheDocument();
  });
});
