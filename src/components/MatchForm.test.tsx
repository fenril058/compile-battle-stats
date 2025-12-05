import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Protocol, Trio } from "../types";
import { MatchForm } from "./MatchForm";

// react-toastify をモックし、副作用を防ぐ
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

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

  beforeEach(() => {
    // 登録関数の呼び出し履歴のみをクリア
    mockOnAddMatch.mockClear();
    // window.confirm は vi.spyOn でセットアップし、テストの最後に mockRestore() でクリーンアップするため、
    // ここで vi.restoreAllMocks() や vi.clearAllMocks() を呼ぶのは避けます。
  });

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

  // NEW: 重複確認フローのテスト ===

  it("should submit immediately when no duplication exists", () => {
    // チーム内: APATHY, DARKNESS, GRAVITY (OK) / チーム間: HATE, LIFE, METAL (OK) -> 確認なしでOK
    render(<MatchForm {...defaultProps} />);

    // window.confirm が呼び出されないことを確認するためにスパイを設定
    const confirmSpy = vi.spyOn(window, "confirm");

    fireEvent.click(screen.getByText("先攻WIN"));

    // 登録処理が実行されたこと
    expect(mockOnAddMatch).toHaveBeenCalledTimes(1);
    // 確認ダイアログは呼び出されなかったこと
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("should show CONFIRM for INTER-TEAM duplication and proceed on OK", () => {
    // チーム内: APATHY, DARKNESS, GRAVITY (OK) / チーム間: GRAVITY, LIFE, METAL (GRAVITYが重複)

    // window.confirm をモックし、戻り値を true (OK) に設定
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => true);

    render(<MatchForm {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");

    // 後攻の1つ目 (index 3) を GRAVITY に変更し、チーム間重複を発生させる
    fireEvent.change(selects[3], { target: { value: "GRAVITY" } });

    fireEvent.click(screen.getByText("先攻WIN"));

    // 確認ダイアログが呼び出されたこと
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    // 登録処理が実行されたこと (OKしたため)
    expect(mockOnAddMatch).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore(); // モックを元に戻す
  });

  it("should show CONFIRM for INTER-TEAM duplication and ABORT on CANCEL", () => {
    // チーム内: APATHY, DARKNESS, GRAVITY (OK) / チーム間: GRAVITY, LIFE, METAL (GRAVITYが重複)

    // window.confirm をモックし、戻り値を false (CANCEL) に設定
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => false);

    render(<MatchForm {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");

    // 後攻の1つ目 (index 3) を GRAVITY に変更し、チーム間重複を発生させる
    fireEvent.change(selects[3], { target: { value: "GRAVITY" } });

    fireEvent.click(screen.getByText("先攻WIN"));

    // 確認ダイアログが呼び出されたこと
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    // 登録処理が実行されなかったこと
    expect(mockOnAddMatch).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("should prioritize INTRA-TEAM duplication CONFIRM and ABORT on CANCEL", () => {
    // チーム内: APATHY, APATHY, GRAVITY (重複あり: 最優先) / チーム間: HATE, LIFE, METAL (重複なし)

    // window.confirm をモックし、戻り値を false (CANCEL) に設定
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => false);

    render(<MatchForm {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");

    // 先攻の2つ目 (index 1) を APATHY に変更し、チーム内重複を発生させる
    fireEvent.change(selects[1], { target: { value: "APATHY" } });

    fireEvent.click(screen.getByText("先攻WIN"));

    // 確認ダイアログが呼び出されたこと
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    // 登録処理が実行されなかったこと
    expect(mockOnAddMatch).not.toHaveBeenCalled();

    // 確認メッセージがチーム内重複に関するものであることを検証 (完全なメッセージの比較は省略)
    expect(confirmSpy.mock.calls[0][0]).toContain(
      "チーム内のプロトコルに重複があります",
    );

    confirmSpy.mockRestore();
  });

  it("should prioritize INTRA-TEAM duplication CONFIRM over INTER-TEAM duplication", () => {
    // チーム内: APATHY, APATHY, GRAVITY (重複あり: 最優先) / チーム間: APATHY, LIFE, METAL (APATHYが重複)

    // window.confirm をモックし、戻り値を true (OK) に設定
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => true);

    render(<MatchForm {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");

    // 先攻の2つ目 (index 1) を APATHY に変更 (チーム内重複)
    fireEvent.change(selects[1], { target: { value: "APATHY" } });
    // 後攻の1つ目 (index 3) を APATHY に変更 (チーム間重複)
    fireEvent.change(selects[3], { target: { value: "APATHY" } });

    fireEvent.click(screen.getByText("先攻WIN"));

    // 登録処理が実行されたこと (OKしたため)
    expect(mockOnAddMatch).toHaveBeenCalledTimes(1);
    // 警告は一度しか呼び出されず、それがチーム内重複のメッセージであること
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0][0]).toContain(
      "チーム内のプロトコルに重複があります",
    ); // チーム内重複のメッセージが出たか

    confirmSpy.mockRestore();
  });
});
