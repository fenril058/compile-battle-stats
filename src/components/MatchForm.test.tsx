import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Protocol, Trio } from "../types";
import { MatchForm } from "./MatchForm";

// モックデータ
const PROTOCOLS = [
  "APATHY",
  "DARKNESS",
  "GRAVITY",
  "HATE",
  "LIFE",
  "METAL",
] as const;

describe("MatchForm", () => {
  const mockOnAddMatch = vi.fn();
  const mockRatioSum = (t: Trio) => t.length * 10; // ダミー計算

  const defaultProps = {
    protocols: PROTOCOLS,
    onAddMatch: mockOnAddMatch,
    isRegistrationAllowed: true,
    mode: "firebase",
    ratioSum: mockRatioSum,
  };

  it("renders correctly with initial values", () => {
    render(<MatchForm {...defaultProps} />);

    // セレクトボックスが6つあるか (First 3 + Second 3)
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(6);

    // WINボタンがあるか
    expect(screen.getByText("先攻WIN")).toBeInTheDocument();
    expect(screen.getByText("後攻WIN")).toBeInTheDocument();
  });

  it("calls onAddMatch with correct data when WIN button is clicked", () => {
    render(<MatchForm {...defaultProps} />);

    // そのまま "先攻WIN" をクリック（初期値 APATHY,DARKNESS,GRAVITY vs HATE,LIFE,METAL が有効な前提）
    fireEvent.click(screen.getByText("先攻WIN"));

    expect(mockOnAddMatch).toHaveBeenCalledTimes(1);
    const args = mockOnAddMatch.mock.calls[0][0];

    expect(args.winner).toBe("FIRST");
    expect(args.first).toEqual(["APATHY", "DARKNESS", "GRAVITY"]);
    expect(args.second).toEqual(["HATE", "LIFE", "METAL"]);
  });

  it("disables buttons when registration is not allowed", () => {
    render(<MatchForm {...defaultProps} isRegistrationAllowed={false} />);

    // メッセージが表示されるか
    expect(screen.getByText("登録期間が終了しました")).toBeInTheDocument();

    // WINボタンが表示されない、もしくは押せない状態
    expect(screen.queryByText("先攻WIN")).toBeNull();
  });

  it("resets selections when protocols change (Season Change)", () => {
    const { rerender } = render(<MatchForm {...defaultProps} />);

    // ユーザー操作：先攻の1つ目を "DARKNESS" に変更してみる
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "DARKNESS" } });
    expect(selects[0]).toHaveValue("DARKNESS");

    // シーズン変更をシミュレート（protocols propを変更）
    const newProtocols = [
      "N1",
      "N2",
      "N3",
      "N4",
      "N5",
      "N6",
    ] as unknown as Protocol[];
    rerender(<MatchForm {...defaultProps} protocols={newProtocols} />);

    // 選択肢がリセットされ、新しいプロトコルの初期値（N1）になっているか
    const updatedSelects = screen.getAllByRole("combobox");
    expect(updatedSelects[0]).toHaveValue("N1");
  });

  it("updates date input", () => {
    render(<MatchForm {...defaultProps} />);

    const dateInput = screen.getByLabelText("対戦日 (任意)");
    fireEvent.change(dateInput, { target: { value: "2024-12-25" } });

    expect(dateInput).toHaveValue("2024-12-25");

    // Submitして日付が含まれるか確認
    fireEvent.click(screen.getByText("先攻WIN"));

    const args = mockOnAddMatch.mock.lastCall?.[0];
    expect(args?.matchDate).toBe(new Date("2024-12-25").getTime());
  });
});
