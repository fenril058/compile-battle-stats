import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Match, Protocol } from "../types";
import { MatchList } from "./MatchList";

const P1 = "DARKNESS" as Protocol;
const P2 = "FIRE" as Protocol;
const P3 = "GRAVITY" as Protocol;
const P4 = "WATER" as Protocol;
const P5 = "LIFE" as Protocol;
const P6 = "METAL" as Protocol;

function makeMatches(count: number): Match[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `match-${i}`,
    first: [P1, P2, P3],
    second: [P4, P5, P6],
    winner: "FIRST" as const,
    ratio: false,
    createdAt: Date.now() - i * 1000,
    matchDate: null,
  }));
}

describe("MatchList", () => {
  const mockOnRemove = vi.fn();

  const defaultProps = {
    onRemove: mockOnRemove,
    isRegistrationAllowed: true,
  };

  beforeEach(() => {
    mockOnRemove.mockClear();
  });

  // --- 削除フロー ---

  describe("delete flow", () => {
    it("削除ボタンをクリックすると 確認/戻る が表示される", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(1)} />);

      fireEvent.click(screen.getByRole("button", { name: "削除" }));

      expect(screen.getByRole("button", { name: "確認" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "戻る" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "削除" }),
      ).not.toBeInTheDocument();
    });

    it("確認をクリックすると onRemove が呼ばれ、削除ボタンに戻る", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(1)} />);

      fireEvent.click(screen.getByRole("button", { name: "削除" }));
      fireEvent.click(screen.getByRole("button", { name: "確認" }));

      expect(mockOnRemove).toHaveBeenCalledOnce();
      expect(mockOnRemove).toHaveBeenCalledWith("match-0");
      // 確認後は削除ボタンに戻っている（pendingDeleteId リセット）
      expect(
        screen.queryByRole("button", { name: "確認" }),
      ).not.toBeInTheDocument();
    });

    it("戻るをクリックすると onRemove は呼ばれず 削除ボタンに戻る", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(1)} />);

      fireEvent.click(screen.getByRole("button", { name: "削除" }));
      fireEvent.click(screen.getByRole("button", { name: "戻る" }));

      expect(mockOnRemove).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
    });

    it("isRegistrationAllowed=false のとき 削除ボタンは disabled", () => {
      render(
        <MatchList
          {...defaultProps}
          matches={makeMatches(1)}
          isRegistrationAllowed={false}
        />,
      );

      expect(screen.getByRole("button", { name: "削除" })).toBeDisabled();
    });

    it("複数行のうち1件だけ確認状態になる", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(3)} />);

      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      // 2行目の削除をクリック
      fireEvent.click(deleteButtons[1]);

      // 確認/戻るは1セットのみ
      expect(screen.getAllByRole("button", { name: "確認" })).toHaveLength(1);
      expect(screen.getAllByRole("button", { name: "戻る" })).toHaveLength(1);
      // 残り2行は削除ボタンのまま
      expect(screen.getAllByRole("button", { name: "削除" })).toHaveLength(2);
    });
  });

  // --- ページネーション境界 ---

  describe("pagination – pageNumbers generation", () => {
    it("totalPages <= 5 のとき全ページ番号を表示する", () => {
      // 30件 / pageSize=10 → 3ページ
      render(<MatchList {...defaultProps} matches={makeMatches(30)} />);

      // 上下2つの PaginationControls があるので各ボタンが2つずつ存在する
      expect(screen.getAllByRole("button", { name: "1" })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: "2" })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: "3" })).toHaveLength(2);
    });

    it("先頭付近（page=1）は 1-5 を表示し、末尾ページへのジャンプボタンと ... を出す", () => {
      // 100件 → 10ページ
      render(<MatchList {...defaultProps} matches={makeMatches(100)} />);

      expect(screen.getAllByRole("button", { name: "1" })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: "5" })).toHaveLength(2);
      // 10ページ目へのジャンプボタンが上下にある
      expect(screen.getAllByRole("button", { name: "10" })).toHaveLength(2);
      // ... が上下にある
      expect(screen.getAllByText("...")).toHaveLength(2);
    });

    it("末尾付近（page=10/10）は 6-10 を表示し、先頭ページへのジャンプボタンと ... を出す", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(100)} />);

      // 10ページ目へ移動
      fireEvent.click(screen.getAllByRole("button", { name: "10" })[0]);

      expect(screen.getAllByRole("button", { name: "6" })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: "10" })).toHaveLength(2);
      // 1ページ目へのジャンプボタンが上下にある
      expect(screen.getAllByRole("button", { name: "1" })).toHaveLength(2);
      expect(screen.getAllByText("...")).toHaveLength(2);
    });

    it("中間（page=5/10）はその前後を含む5ページ分を表示する", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(100)} />);

      // 5ページ目へ移動
      fireEvent.click(screen.getAllByRole("button", { name: "5" })[0]);

      // range: 3-7
      for (const page of ["3", "4", "5", "6", "7"]) {
        expect(screen.getAllByRole("button", { name: page })).toHaveLength(2);
      }
    });

    it("pageNumbers[0] === 2 のとき先頭 ... は表示しない（1を直接見せる）", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(100)} />);

      // page=3 へ移動 → range: 1-5 → pageNumbers[0]=1 → ... なし
      // page=4 へ移動 → range: 2-6 → pageNumbers[0]=2 → ... なし (pageNumbers[0] > 2 が false)
      fireEvent.click(screen.getAllByRole("button", { name: "4" })[0]);

      // 1ページ目へのジャンプが "..." なしで出ているか。
      // pageNumbers[0]=2 なので page 1 ジャンプボタンは表示されるが ... は出ない。
      expect(screen.getAllByRole("button", { name: "1" })).toHaveLength(2);
      // "..." はページ末尾側にのみ存在する（末尾ページ10はまだ範囲外）
      expect(screen.getAllByText("...")).toHaveLength(2);
    });

    it("pageNumbers[last] === totalPages-1 のとき末尾 ... は表示しない", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(100)} />);

      // page=7 へ移動 → range: 5-9 → pageNumbers[last]=9=totalPages-1 → 末尾 ... なし
      fireEvent.click(screen.getAllByRole("button", { name: "5" })[0]);
      fireEvent.click(screen.getAllByRole("button", { name: "7" })[0]);

      // 10ページへのジャンプはあるが ... は先頭側のみ
      expect(screen.getAllByRole("button", { name: "10" })).toHaveLength(2);
      // ... は先頭側にのみ (末尾側にはない)
      expect(screen.getAllByText("...")).toHaveLength(2);
    });
  });

  describe("pagination – page clamp & navigation", () => {
    it("page=1 のとき « ボタンは disabled", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(30)} />);

      const prevButtons = screen.getAllByRole("button", { name: "«" });
      for (const btn of prevButtons) {
        expect(btn).toBeDisabled();
      }
    });

    it("最終ページのとき » ボタンは disabled", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(30)} />);

      fireEvent.click(screen.getAllByRole("button", { name: "3" })[0]);

      const nextButtons = screen.getAllByRole("button", { name: "»" });
      for (const btn of nextButtons) {
        expect(btn).toBeDisabled();
      }
    });

    it("表示件数を変更すると page=1 にリセットされる", () => {
      render(<MatchList {...defaultProps} matches={makeMatches(30)} />);

      // page 2 へ移動
      fireEvent.click(screen.getAllByRole("button", { name: "2" })[0]);

      // 表示件数を 20 に変更（30件 → 2ページ）
      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "20" } });

      // "1 / 2 ページ" と表示される
      expect(screen.getAllByText("1 / 2 ページ")).toHaveLength(2);
    });
  });

  // --- displayIndex の逆算 ---

  describe("displayIndex", () => {
    it("page=1 の先頭行は matches.length と同じインデックスを表示する", () => {
      const matches = makeMatches(15);
      render(<MatchList {...defaultProps} matches={matches} />);

      const rows = screen.getAllByRole("row");
      // rows[0] はヘッダー行
      expect(rows[1]).toHaveTextContent("15");
    });

    it("page=1 の最終行のインデックスは matches.length - pageSize + 1", () => {
      const matches = makeMatches(15);
      render(<MatchList {...defaultProps} matches={matches} />);

      const rows = screen.getAllByRole("row");
      // page=1 に 10 件表示 → 最後は 15-10+1=6
      expect(rows[10]).toHaveTextContent("6");
    });

    it("page=2 の先頭行は matches.length - pageSize", () => {
      const matches = makeMatches(15);
      render(<MatchList {...defaultProps} matches={matches} />);

      fireEvent.click(screen.getAllByRole("button", { name: "2" })[0]);

      const rows = screen.getAllByRole("row");
      // page=2 先頭: 15 - 10 = 5
      expect(rows[1]).toHaveTextContent("5");
    });

    it("最終ページの最終行は 1 を表示する", () => {
      const matches = makeMatches(15);
      render(<MatchList {...defaultProps} matches={matches} />);

      fireEvent.click(screen.getAllByRole("button", { name: "2" })[0]);

      const rows = screen.getAllByRole("row");
      // page=2: 5件(11-15番) → 最終行が index=1
      expect(rows[5]).toHaveTextContent("1");
    });
  });

  // --- 空状態 ---

  describe("empty state", () => {
    it("マッチがないとき空メッセージを表示する", () => {
      render(<MatchList {...defaultProps} matches={[]} />);
      expect(
        screen.getByText("試合が登録されていません。"),
      ).toBeInTheDocument();
    });

    it("データなし時は ページ表示 に 'データなし' を出す", () => {
      render(<MatchList {...defaultProps} matches={[]} />);
      expect(screen.getAllByText("データなし")).toHaveLength(2);
    });
  });
});
