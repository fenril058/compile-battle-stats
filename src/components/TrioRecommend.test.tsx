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
  main1: [mk(["DEATH", "FIRE", "WATER"], 70.0, 65, 5, 2)],
  main1ratio: [mk(["LIFE", "SPEED", "WATER"], 55.0, 50, 5, 1)],
  main2: [mk(["CHAOS", "LUCK", "WAR"], 60.0, 55, 5, 2)],
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

  it("Main1全体タブに切り替えると配列が変わる", () => {
    render(<TrioRecommend recommendations={recommendations} />);
    fireEvent.click(screen.getByRole("button", { name: "Main1全体" }));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(
      within(items[0]).getByText("DEATH · FIRE · WATER"),
    ).toBeInTheDocument();
  });

  it("Main1レシオタブに切り替えると配列が変わる", () => {
    render(<TrioRecommend recommendations={recommendations} />);
    fireEvent.click(screen.getByRole("button", { name: "Main1レシオ" }));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(
      within(items[0]).getByText("LIFE · SPEED · WATER"),
    ).toBeInTheDocument();
  });

  it("hasMain2Protocols=true のとき Main2 タブが表示される", () => {
    render(
      <TrioRecommend recommendations={recommendations} hasMain2Protocols />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Main2" }));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(
      within(items[0]).getByText("CHAOS · LUCK · WAR"),
    ).toBeInTheDocument();
  });

  it("hasMain2Protocols=false のとき Main2 タブが表示されない", () => {
    render(<TrioRecommend recommendations={recommendations} />);
    expect(
      screen.queryByRole("button", { name: "Main2" }),
    ).not.toBeInTheDocument();
  });

  it("空配列のスコープでは『データなし』を表示する", () => {
    render(
      <TrioRecommend
        recommendations={{ all: [], main1: [], main1ratio: [], main2: [] }}
      />,
    );
    expect(screen.getByText("データなし")).toBeInTheDocument();
  });
});
