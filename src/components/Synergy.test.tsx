import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SynergyPair } from "../utils/logic";
import { Synergy } from "./Synergy";

const pairs: SynergyPair[] = [
  { n: "FIRE · WATER", g: 6, actual: 80, expected: 55, residual: 25 },
  { n: "LIFE · SPEED", g: 5, actual: 30, expected: 50, residual: -20 },
];

// SYNERGY_N=15 を境界にテストするデータ（残差は降順ソート済み想定）
const makePairs = (count: number): SynergyPair[] =>
  Array.from({ length: count }, (_, i) => ({
    n: `P${i} · Q${i}`,
    g: 5,
    actual: 50,
    expected: 50,
    residual: count - 1 - i * 2, // 降順: count-1, count-3, ...
  }));

describe("Synergy", () => {
  it("ペアが無ければ『データなし』を表示する", () => {
    render(<Synergy pairs={[]} />);
    expect(screen.getByText("データなし")).toBeInTheDocument();
  });

  it("残差降順（正→負）で並べ、符号付きで表示する", () => {
    render(<Synergy pairs={pairs} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("FIRE · WATER")).toBeInTheDocument();
    expect(within(items[0]).getByText("+25.0")).toBeInTheDocument();
    expect(within(items[1]).getByText("LIFE · SPEED")).toBeInTheDocument();
    expect(within(items[1]).getByText("-20.0")).toBeInTheDocument();
  });

  it("30件以下（2N以内）では details を表示しない", () => {
    const { container } = render(<Synergy pairs={makePairs(30)} />);
    expect(container.querySelector("details")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(30);
  });

  it("31件（2N+1）では上位15件＋下位15件を表示し、中位1件を details に折りたたむ", () => {
    const thirty1 = makePairs(31);
    const { container } = render(<Synergy pairs={thirty1} />);

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    if (!details) return;

    expect(
      screen.getByText("他 1 件（中位・残差が小さいペア）"),
    ).toBeInTheDocument();

    const detailsItems = within(details).getAllByRole("listitem");
    expect(detailsItems).toHaveLength(1);
    expect(within(detailsItems[0]).getByText("P15 · Q15")).toBeInTheDocument();

    expect(screen.getAllByRole("listitem")).toHaveLength(31);
  });

  it("上位N件の末尾（15位）と下位N件の先頭（17位相当）がそれぞれ表示される", () => {
    const thirty5 = makePairs(35);
    const { container } = render(<Synergy pairs={thirty5} />);

    expect(screen.getByText("P0 · Q0")).toBeInTheDocument();
    expect(screen.getByText("P14 · Q14")).toBeInTheDocument();
    expect(screen.getByText("P20 · Q20")).toBeInTheDocument();
    expect(screen.getByText("P34 · Q34")).toBeInTheDocument();

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    if (!details) return;
    expect(within(details).getAllByRole("listitem")).toHaveLength(5);
    expect(
      screen.getByText("他 5 件（中位・残差が小さいペア）"),
    ).toBeInTheDocument();
  });
});
