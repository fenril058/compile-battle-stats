import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

const Bomb = () => {
  throw new Error("test explosion");
};

describe("ErrorBoundary", () => {
  it("子コンポーネントが正常な場合はそのまま描画する", () => {
    render(
      <ErrorBoundary>
        <span>OK</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("子コンポーネントがエラーを投げるとフォールバック UI を表示する", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "再読み込み" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "localStorage をクリアして再読み込み",
      }),
    ).toBeInTheDocument();
    spy.mockRestore();
  });
});
