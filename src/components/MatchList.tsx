import React, { useMemo, useState } from "react";
import type { Match } from "../types";

type MatchListProps = {
  matches: Match[];
  onRemove: (id: string) => void;
  isRegistrationAllowed: boolean;
};

// --- 1. 定数を定義 ---
// 1ページあたりの表示件数のオプション
const DISPLAY_OPTIONS = [10, 20, 50, 100];
// デフォルトの表示件数
const DEFAULT_PAGE_SIZE = 10;

// 日付フォーマット用のヘルパー関数
// 引数が undefined/null の場合は "-" を返す
const formatDate = (timestamp: number | undefined | null, includeTime = false) => {
  if (!timestamp) return "-";

  const date = new Date(timestamp);

  // ユーザーのブラウザ設定(ロケール)に合わせてフォーマット
  // 'ja-JP' なら 2023/12/03、'en-US' なら 12/03/2023 になります
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
    })
  }).format(date);
};

// ★ Wrap in React.memo to prevent re-render when typing in Form
export const MatchList: React.FC<MatchListProps> = React.memo(({
  matches,
  onRemove,
  isRegistrationAllowed,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // 総ページ数を計算
  const totalPages = Math.ceil(matches.length / pageSize);

  // データをスライス
  const displayMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    // ページネーションに合わせてデータをスライス
    return matches.slice(start, end); // Assumes matches are already sorted NEWEST first
  }, [matches, currentPage, pageSize]);

  // ページ変更ハンドラ
  const handlePageChange = (page: number) => {
    // ページ番号が有効範囲内であることを確認
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 表示件数変更ハンドラ
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // 表示件数を更新
    const newPageSize = Number(event.target.value);
    setPageSize(newPageSize);

    // 表示件数が変わったら、現在のページを1ページ目に戻す
    setCurrentPage(1);
  };

  // ページネーションコントロールの配列を生成
  const pageNumbers = useMemo(() => {
    const range = [];
    // ページネーションUIの表示を制限 (例: 現在ページとその前後2ページまで)
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // 最終ページが近づいた場合の調整
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-zinc-900 p-3 rounded-2xl overflow-x-auto mb-6">
      <h2 className="font-semibold mb-2 text-center"
      >
         登録試合一覧({matches.length})
      </h2>

      {/* ページネーションコントロール (上部) */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        pageNumbers={pageNumbers}
        handlePageChange={handlePageChange}
        handlePageSizeChange={handlePageSizeChange}
        totalMatches={matches.length}
      />

      <div className="relative max-h-[600px] overflow-y-auto overflow-x-auto">
        <table className="text-xs w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-800 text-zinc-300">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2 min-w-[100px]">登録日</th>
              <th className="p-2 min-w-[50px]">先攻</th>
              <th className="p-2 min-w-[50px]">後攻</th>
              <th className="p-2 min-w-[50px]">勝者</th>
              <th className="p-2 min-w-[60px]">レシオ</th>
              <th className="p-2 min-w-[100px]">対戦日</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {displayMatches.map((m, i) => {
              // matches は App.tsx 最新順（createdAt 降順）にソートされている前提で、
              // 全件の中での連番を計算
              const displayIndex = (matches.length - ((currentPage - 1) * pageSize) - i);
              return (
                <tr
                  key={m.id}
                  className={`border-t border-zinc-800 text-center ${
                    i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-950"
                  }`}
                >
                  <td className="p-2">{displayIndex}</td>
                  <td className="p-2">
                    {formatDate(m.createdAt)}
                  </td>
                  <td
                    className={`p-2 ${
                      m.winner === "FIRST" ? "font-bold text-white" : "text-zinc-300"
                    }`}
                  >
                    {m.first.join(", ")}
                  </td>
                  <td
                    className={`p-2 ${
                      m.winner === "SECOND" ? "font-bold text-white" : "text-zinc-300"
                    }`}
                  >
                    {m.second.join(", ")}
                  </td>
                  <td className="p-2">{m.winner === "FIRST" ? "先攻" : "後攻"}</td>
                  <td className="p-2">{m.ratio ? "◯" : ""}</td>
                  <td className="p-2">
                    {formatDate(m.matchDate)}
                  </td>
                  <td className="p-2 min-w-[60px]">
                    <button
                      onClick={() => onRemove(m.id)}
                      disabled={!isRegistrationAllowed}
                      className={`text-xs px-2 py-1 rounded ${
                        isRegistrationAllowed
                          ? "text-red-400 hover:bg-red-900/30 hover:text-red-300"
                          : "text-zinc-600 cursor-not-allowed"
                      }`}
                    >
                       ️削除
                    </button>
                  </td>
                </tr>
              )
            })}
            {displayMatches.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-zinc-500">試合が登録されていません。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* ページネーションコントロール (下部) */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        pageNumbers={pageNumbers}
        handlePageChange={handlePageChange}
        handlePageSizeChange={handlePageSizeChange}
        totalMatches={matches.length}
      />
    </div>
  );
});

// --- ページネーションUIを分離したコンポーネント ---
// PaginationControls コンポーネントが受け取るPropsの型定義
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageNumbers: number[]; // ページ番号の配列は数値型であることを明示
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  totalMatches: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  pageSize,
  pageNumbers,
  handlePageChange,
  handlePageSizeChange,
  totalMatches,
}) => (
  <div className="flex justify-between items-center text-xs mt-2 text-zinc-400">
    {/* 表示件数選択 */}
    <div className="flex items-center space-x-2">
      <span>表示件数:</span>
      <select
        value={pageSize}
        onChange={handlePageSizeChange}
        className="bg-zinc-800 border border-zinc-700 rounded p-1 text-white"
      >
        {DISPLAY_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>

    {/* ページネーションボタン */}
    <div className="flex items-center space-x-1">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 rounded disabled:text-zinc-600 hover:bg-zinc-800/50"
      >
        «
      </button>

      {/* 最初のページへジャンプ */}
      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => handlePageChange(1)}
            className="px-2 py-1 rounded hover:bg-zinc-800/50"
          >
            1
          </button>
          {pageNumbers[0] > 2 && <span className="px-1">...</span>}
        </>
      )}

      {/* ページ番号ボタン */}
      {pageNumbers.map(page => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-2 py-1 rounded ${
            page === currentPage ? "bg-blue-600 text-white font-bold" : "hover:bg-zinc-800/50"
          }`}
        >
          {page}
        </button>
      ))}

      {/* 最後のページへジャンプ */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-1">...</span>}
          <button
            onClick={() => handlePageChange(totalPages)}
            className="px-2 py-1 rounded hover:bg-zinc-800/50"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-2 py-1 rounded disabled:text-zinc-600 hover:bg-zinc-800/50"
      >
        »
      </button>
    </div>

    {/* 現在のページ/総ページ数 */}
    <div className="text-sm">
      {/* matches.length を totalMatches に置き換える */}
      {totalMatches > 0 ? `${currentPage} / ${totalPages} ページ` : 'データなし'}
    </div>
  </div>
);
