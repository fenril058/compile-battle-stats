import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ImportPreview } from "../hooks/useCsvImport";
import { DataToolbar } from "./DataToolbar";

const noop = vi.fn();

const baseProps = {
  onExport: noop,
  onImport: noop,
  isRegistrationAllowed: true,
};

/** preview が non-null のとき渡すサンプルデータ */
const makePreview = (
  okCount: number,
  failures: string[] = [],
): ImportPreview => ({
  payloads: Array.from({ length: okCount }, () => ({
    first: ["FIRE", "WATER", "METAL"] as [string, string, string],
    second: ["LIFE", "SPIRIT", "SPEED"] as [string, string, string],
    winner: "FIRST" as const,
    ratio: false,
    createdAt: 0,
    matchDate: null,
  })) as ImportPreview["payloads"],
  failures,
});

describe("DataToolbar", () => {
  it("isRegistrationAllowed=false のときインポートセクションを表示しない", () => {
    render(<DataToolbar {...baseProps} isRegistrationAllowed={false} />);
    expect(
      screen.queryByText("CSVから試合データをインポート"),
    ).not.toBeInTheDocument();
  });

  it("preview が null のときプレビューパネルを表示しない", () => {
    render(<DataToolbar {...baseProps} preview={null} />);
    expect(screen.queryByText(/件を登録できます/)).not.toBeInTheDocument();
  });

  it("preview が non-null のときサマリを表示する", () => {
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(3, ["bad row 1", "bad row 2"])}
        onConfirmImport={noop}
        onCancelImport={noop}
      />,
    );
    // ja: 「3件を登録できます（2件は形式エラー）」
    expect(screen.getByText(/3件を登録できます/)).toBeInTheDocument();
    expect(screen.getByText(/2件は形式エラー/)).toBeInTheDocument();
  });

  it("失敗行がある場合は見出しと失敗行を表示する", () => {
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(1, ["bad,row,here", "another,bad,row"])}
        onConfirmImport={noop}
        onCancelImport={noop}
      />,
    );
    expect(screen.getByText("失敗行の例:")).toBeInTheDocument();
    expect(screen.getByText("bad,row,here")).toBeInTheDocument();
    expect(screen.getByText("another,bad,row")).toBeInTheDocument();
  });

  it("失敗行が無い場合は失敗行の見出しを表示しない", () => {
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(2, [])}
        onConfirmImport={noop}
        onCancelImport={noop}
      />,
    );
    expect(screen.queryByText("失敗行の例:")).not.toBeInTheDocument();
  });

  it("失敗行が5件を超える場合は先頭5件のみ表示する", () => {
    const failures = ["row1", "row2", "row3", "row4", "row5", "row6"];
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(0, failures)}
        onConfirmImport={noop}
        onCancelImport={noop}
      />,
    );
    expect(screen.getByText("row5")).toBeInTheDocument();
    expect(screen.queryByText("row6")).not.toBeInTheDocument();
  });

  it("payloads が 0 件のとき「登録する」ボタンが disabled になる", () => {
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(0, ["bad row"])}
        onConfirmImport={noop}
        onCancelImport={noop}
      />,
    );
    const confirmBtn = screen.getByRole("button", { name: "登録する" });
    expect(confirmBtn).toBeDisabled();
  });

  it("payloads がある場合「登録する」ボタンが enabled になる", () => {
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(2)}
        onConfirmImport={noop}
        onCancelImport={noop}
      />,
    );
    const confirmBtn = screen.getByRole("button", { name: "登録する" });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("「登録する」ボタンをクリックすると onConfirmImport が呼ばれる", () => {
    const onConfirmImport = vi.fn();
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(1)}
        onConfirmImport={onConfirmImport}
        onCancelImport={noop}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "登録する" }));
    expect(onConfirmImport).toHaveBeenCalledTimes(1);
  });

  it("「キャンセル」ボタンをクリックすると onCancelImport が呼ばれる", () => {
    const onCancelImport = vi.fn();
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(1)}
        onConfirmImport={noop}
        onCancelImport={onCancelImport}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onCancelImport).toHaveBeenCalledTimes(1);
  });

  it("50文字を超える失敗行は切り詰めて表示する", () => {
    const longLine = "A".repeat(60);
    render(
      <DataToolbar
        {...baseProps}
        preview={makePreview(0, [longLine])}
        onConfirmImport={noop}
        onCancelImport={noop}
      />,
    );
    // 50文字 + "…" になる
    expect(screen.getByText(`${"A".repeat(50)}…`)).toBeInTheDocument();
  });
});
