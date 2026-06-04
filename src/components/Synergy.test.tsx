import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SynergyPair } from "../utils/logic";
import { Synergy } from "./Synergy";

const pairs: SynergyPair[] = [
  { n: "FIRE · WATER", g: 6, actual: 80, expected: 55, residual: 25 },
  { n: "LIFE · SPEED", g: 5, actual: 30, expected: 50, residual: -20 },
];

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
});
