import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MatrixView, StatsView } from "../hooks/useMatchStats";
import type { MatrixData, StatsResult } from "../types";
import type { UsageTimeline } from "../utils/logic";
import { StatsDashboard } from "./StatsDashboard";

// Matrix / MatrixPairList / Stat は描画コストが高いのでスタブ化
vi.mock("./Matrix", () => ({
  Matrix: ({ t }: { t: string }) => <div data-testid="matrix">{t}</div>,
}));
vi.mock("./MatrixPairList", () => ({
  MatrixPairList: () => <div data-testid="matrix-pair-list" />,
}));
vi.mock("./Stat", () => ({
  Stat: ({ t }: { t: string }) => <div data-testid="stat">{t}</div>,
}));

const emptyStats: StatsResult = {
  single: {},
  pair: {},
  trio: {},
  first: {},
  second: {},
};

const emptyStatView: StatsView = {
  normal: emptyStats,
  ratio: emptyStats,
  all: emptyStats,
};

const emptyMatrix: MatrixData = {};

const emptyMatrixView: MatrixView = {
  data: emptyMatrix,
  residual: emptyMatrix,
  protocols: ["FIRE", "WATER"],
};

const emptyUsage: UsageTimeline = { buckets: [], series: [] };

const makeProps = (overrides?: Partial<Parameters<typeof StatsDashboard>[0]>) =>
  ({
    statViews: {
      all: emptyStatView,
      v1aux: emptyStatView,
      main2aux: emptyStatView,
      mixed: emptyStatView,
    },
    matrixViews: {
      all: { ...emptyMatrixView, reducedProtocols: ["FIRE"], pairs: [] },
      v1aux: emptyMatrixView,
      main2aux: emptyMatrixView,
      ratio: emptyMatrixView,
    },
    minPair: 5,
    minTrio: 3,
    strengthModel: {
      theta: {},
      firstAdvantage: 0,
      games: 0,
      iterations: 0,
      converged: true,
    },
    synergy: [],
    usage: emptyUsage,
    archetypes: { archetypes: [], matrix: [], games: [] },
    ...overrides,
  }) satisfies Parameters<typeof StatsDashboard>[0];

describe("StatsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトは startViewTransition なし（フォールバックパス）
    Object.defineProperty(document, "startViewTransition", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("すべての stat タブラベルを描画する", () => {
    render(<StatsDashboard {...makeProps()} />);
    // 「全体」「Main1」「Main2」は stat / matrix 両方に存在するため getAllBy を使う
    for (const label of ["全体", "Main1", "Main2"]) {
      expect(
        screen.getAllByRole("tab", { name: label }).length,
      ).toBeGreaterThanOrEqual(1);
    }
    expect(screen.getByRole("tab", { name: "混合" })).toBeInTheDocument();
  });

  it("すべての matrix タブラベルを描画する", () => {
    render(<StatsDashboard {...makeProps()} />);
    expect(
      screen.getByRole("tab", { name: "レシオ(Main1)" }),
    ).toBeInTheDocument();
    // 「全体」は stat + matrix 両方に存在
    expect(screen.getAllByRole("tab", { name: "全体" }).length).toBe(2);
  });

  it("Stat タブをクリックすると aria-selected が切り替わる", () => {
    render(<StatsDashboard {...makeProps()} />);
    const main1Tab = screen.getAllByRole("tab", { name: "Main1" })[0];
    expect(main1Tab).toHaveAttribute("aria-selected", "false");
    fireEvent.click(main1Tab);
    expect(main1Tab).toHaveAttribute("aria-selected", "true");
  });

  it("Matrix タブをクリックすると aria-selected が切り替わる", () => {
    render(<StatsDashboard {...makeProps()} />);
    const ratioTab = screen.getByRole("tab", { name: "レシオ(Main1)" });
    expect(ratioTab).toHaveAttribute("aria-selected", "false");
    fireEvent.click(ratioTab);
    expect(ratioTab).toHaveAttribute("aria-selected", "true");
  });

  it("startViewTransition がある場合も stat タブ切替が動作する", () => {
    const transition = vi.fn((cb: () => void) => cb());
    Object.defineProperty(document, "startViewTransition", {
      value: transition,
      writable: true,
      configurable: true,
    });
    render(<StatsDashboard {...makeProps()} />);
    const main2Tab = screen.getAllByRole("tab", { name: "Main2" })[0];
    fireEvent.click(main2Tab);
    expect(transition).toHaveBeenCalled();
    expect(main2Tab).toHaveAttribute("aria-selected", "true");
  });

  it("startViewTransition がある場合も matrix タブ切替が動作する", () => {
    const transition = vi.fn((cb: () => void) => cb());
    Object.defineProperty(document, "startViewTransition", {
      value: transition,
      writable: true,
      configurable: true,
    });
    render(<StatsDashboard {...makeProps()} />);
    const main2Tabs = screen.getAllByRole("tab", { name: "Main2" });
    const matrixMain2 = main2Tabs[1];
    fireEvent.click(matrixMain2);
    expect(transition).toHaveBeenCalled();
    expect(matrixMain2).toHaveAttribute("aria-selected", "true");
  });

  it("stat タブで ArrowRight キーが次タブへ移動する", () => {
    render(<StatsDashboard {...makeProps()} />);
    const allTab = screen.getAllByRole("tab", { name: "全体" })[0];
    fireEvent.keyDown(allTab, { key: "ArrowRight" });
    const main1Tab = screen.getAllByRole("tab", { name: "Main1" })[0];
    expect(main1Tab).toHaveAttribute("aria-selected", "true");
  });

  it("stat タブで ArrowLeft キーが前タブへ移動する", () => {
    render(<StatsDashboard {...makeProps()} />);
    // まず Main1 へ移動
    const allTab = screen.getAllByRole("tab", { name: "全体" })[0];
    fireEvent.keyDown(allTab, { key: "ArrowRight" });
    const main1Tab = screen.getAllByRole("tab", { name: "Main1" })[0];
    fireEvent.keyDown(main1Tab, { key: "ArrowLeft" });
    expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  it("最初のタブで ArrowLeft は何もしない", () => {
    render(<StatsDashboard {...makeProps()} />);
    const allTab = screen.getAllByRole("tab", { name: "全体" })[0];
    fireEvent.keyDown(allTab, { key: "ArrowLeft" });
    expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  it("最後の stat タブで ArrowRight は何もしない", () => {
    render(<StatsDashboard {...makeProps()} />);
    const mixedTab = screen.getByRole("tab", { name: "混合" });
    // まず 混合 タブを選択
    fireEvent.click(mixedTab);
    fireEvent.keyDown(mixedTab, { key: "ArrowRight" });
    expect(mixedTab).toHaveAttribute("aria-selected", "true");
  });

  it("matrix タブで ArrowRight キーが次タブへ移動する", () => {
    render(<StatsDashboard {...makeProps()} />);
    const allMatrixTab = screen.getAllByRole("tab", { name: "全体" })[1];
    fireEvent.keyDown(allMatrixTab, { key: "ArrowRight" });
    const main1MatrixTab = screen.getAllByRole("tab", { name: "Main1" })[1];
    expect(main1MatrixTab).toHaveAttribute("aria-selected", "true");
  });

  it("matrix タブで ArrowLeft キーが前タブへ移動する", () => {
    render(<StatsDashboard {...makeProps()} />);
    const allMatrixTab = screen.getAllByRole("tab", { name: "全体" })[1];
    fireEvent.keyDown(allMatrixTab, { key: "ArrowRight" });
    const main1MatrixTab = screen.getAllByRole("tab", { name: "Main1" })[1];
    fireEvent.keyDown(main1MatrixTab, { key: "ArrowLeft" });
    expect(allMatrixTab).toHaveAttribute("aria-selected", "true");
  });

  it("全体タブで「出現のみ」ボタンを表示し切替できる", () => {
    render(<StatsDashboard {...makeProps()} />);
    const compactBtn = screen.getByRole("button", { name: "出現のみ" });
    expect(compactBtn).toBeInTheDocument();
    expect(compactBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(compactBtn);
    expect(compactBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("「全プロトコル」ボタンで compact を解除できる", () => {
    render(<StatsDashboard {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "出現のみ" }));
    fireEvent.click(screen.getByRole("button", { name: "全プロトコル" }));
    expect(
      screen.getByRole("button", { name: "全プロトコル" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("散布図の対象トグル（全体/通常戦/レシオ）で aria-pressed が切り替わる", () => {
    render(<StatsDashboard {...makeProps()} />);
    // これらはタブ(role=tab)ではなく散布図トグルの button として一意
    const allBtn = screen.getByRole("button", { name: "全体" });
    const normalBtn = screen.getByRole("button", { name: "通常戦" });
    const ratioBtn = screen.getByRole("button", { name: "レシオ" });
    expect(allBtn).toHaveAttribute("aria-pressed", "true");
    expect(normalBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(normalBtn);
    expect(normalBtn).toHaveAttribute("aria-pressed", "true");
    expect(allBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(ratioBtn);
    expect(ratioBtn).toHaveAttribute("aria-pressed", "true");
    expect(normalBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("matrixCompactEmpty のとき「データがありません」メッセージを表示する", () => {
    const props = makeProps({
      matrixViews: {
        all: {
          data: emptyMatrix,
          residual: emptyMatrix,
          protocols: ["FIRE", "WATER"],
          reducedProtocols: [], // 空 = compact empty
          pairs: [],
        },
        v1aux: emptyMatrixView,
        main2aux: emptyMatrixView,
        ratio: emptyMatrixView,
      },
    });
    render(<StatsDashboard {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "出現のみ" }));
    expect(
      screen.getByText(/戦以上の対戦データがまだありません/),
    ).toBeInTheDocument();
  });

  it("全体タブ以外では compact コントロールを表示しない", () => {
    render(<StatsDashboard {...makeProps()} />);
    const ratioTab = screen.getByRole("tab", { name: "レシオ(Main1)" });
    fireEvent.click(ratioTab);
    expect(
      screen.queryByRole("button", { name: "出現のみ" }),
    ).not.toBeInTheDocument();
  });

  it("pairs が定義された matrixView では出現ペア一覧を描画する（旧表示の折りたたみ内）", () => {
    render(<StatsDashboard {...makeProps()} />);
    expect(screen.getByTestId("matrix-pair-list")).toBeInTheDocument();
    // 旧表示（実測勝率の相性表・ペア一覧）の summary も存在する
    expect(
      screen.getByText(/旧表示（実測勝率の相性表・ペア一覧）/),
    ).toBeInTheDocument();
  });

  it("pairs が undefined の matrixView では出現ペア一覧を描画しない", () => {
    const props = makeProps({
      matrixViews: {
        all: { data: emptyMatrix, residual: emptyMatrix, protocols: ["FIRE"] },
        v1aux: emptyMatrixView,
        main2aux: emptyMatrixView,
        ratio: emptyMatrixView,
      },
    });
    render(<StatsDashboard {...props} />);
    expect(screen.queryByTestId("matrix-pair-list")).not.toBeInTheDocument();
  });
});
