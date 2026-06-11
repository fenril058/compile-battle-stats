import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useT } from "../i18n";
import { formatCalendarDate } from "../lib/date";
import type { Match, StorageMode } from "../types";

type MatchListProps = {
  matches: Match[];
  onRemove: (id: string) => void;
  isRegistrationAllowed: boolean;
  // 共有ボードなので「自分が登録した行」だけ削除可能にする（Firestore rules と一致）。
  mode: StorageMode;
  // ログイン中ユーザーの uid（remote・未ログインや local では undefined）。
  currentUserId?: string;
};

// --- 1. 定数を定義 ---
// 1ページあたりの表示件数のオプション
const DISPLAY_OPTIONS = [10, 20, 50, 100];
// デフォルトの表示件数
const DEFAULT_PAGE_SIZE = 10;

// 登録日時(createdAt)用のフォーマッタ。createdAt は「登録した瞬間」なので
// 閲覧者のローカル TZ で表示する（暦日である対戦日 matchDate は
// formatCalendarDate で UTC 固定表示する → #69）。
// 引数が undefined/null の場合は "-" を返す。
const formatDate = (
  timestamp: number | undefined | null,
  includeTime = false,
) => {
  if (!timestamp) return "-";

  const date = new Date(timestamp);

  // ユーザーのブラウザ設定(ロケール)に合わせてフォーマット
  // 'ja-JP' なら 2023/12/03、'en-US' なら 12/03/2023 になります
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime && {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }).format(date);
};

// ★ Wrap in React.memo to prevent re-render when typing in Form
export const MatchList: React.FC<MatchListProps> = React.memo(
  ({ matches, onRemove, isRegistrationAllowed, mode, currentUserId }) => {
    const { t } = useT();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

    // 総ページ数を計算
    const totalPages = Math.ceil(matches.length / pageSize);

    // シーズン切替・削除で件数が減ったとき currentPage > totalPages になりうる。
    // useEffect で state を書き戻すと1フレーム遅延するため、導出値でクランプする。
    const effectivePage = Math.min(currentPage, Math.max(1, totalPages));

    // データをスライス
    const displayMatches = useMemo(() => {
      const start = (effectivePage - 1) * pageSize;
      const end = start + pageSize;
      // ページネーションに合わせてデータをスライス
      return matches.slice(start, end); // Assumes matches are already sorted NEWEST first
    }, [matches, effectivePage, pageSize]);

    const handleDeleteClick = useCallback((id: string) => {
      setPendingDeleteId(id);
    }, []);

    // 自分が所有する行か。local は認証が無く全データが単一ユーザーのものなので常に true。
    // remote は Firestore rules と一致させ、ログイン済みかつ自分の userId の行だけ true
    // （他人の行・userId 無しのレガシー行・未ログインは false → 削除不可）。
    const isOwn = useCallback(
      (m: Match): boolean =>
        mode === "local" ? true : !!currentUserId && m.userId === currentUserId,
      [mode, currentUserId],
    );

    // 「自分」バッジ・行ハイライトは共有ボードの remote のみ意味を持つ
    // （local は全部自分の行なので付けても情報量ゼロ）。
    const showOwnMark = useCallback(
      (m: Match): boolean => mode === "remote" && isOwn(m),
      [mode, isOwn],
    );

    // 「確認」ボタン表示に切り替わったタイミングでのみフォーカスを移す。
    // ref callback 内で focus() すると再レンダーのたびに焦点を奪い返してしまう
    // （remote モードの onSnapshot 更新など）ため、pendingDeleteId 変化時に限定する。
    useEffect(() => {
      if (pendingDeleteId) confirmButtonRef.current?.focus();
    }, [pendingDeleteId]);

    // ページ変更ハンドラ
    const handlePageChange = (page: number) => {
      // ページ番号が有効範囲内であることを確認
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    };

    // 表示件数変更ハンドラ
    const handlePageSizeChange = (
      event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
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
      let startPage = Math.max(
        1,
        effectivePage - Math.floor(maxPagesToShow / 2),
      );
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // 最終ページが近づいた場合の調整
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        range.push(i);
      }
      return range;
    }, [effectivePage, totalPages]);

    return (
      <div className="bg-zinc-900 p-3 rounded-2xl overflow-x-auto mb-6">
        <h2 className="font-semibold mb-2 text-center">
          {t("matchList.title", { count: matches.length })}
        </h2>

        {/* ページネーションコントロール (上部) */}
        <PaginationControls
          currentPage={effectivePage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageNumbers={pageNumbers}
          handlePageChange={handlePageChange}
          handlePageSizeChange={handlePageSizeChange}
          totalMatches={matches.length}
          label={t("matchList.paginationTop")}
        />

        <div className="table-scroll-container relative max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="text-xs w-full border-collapse">
            <caption className="sr-only">{t("matchList.caption")}</caption>
            <thead className="sticky top-0 z-10 bg-zinc-800 text-zinc-300">
              <tr>
                <th className="p-2" scope="col">
                  #
                </th>
                <th className="p-2 min-w-[100px]" scope="col">
                  {t("matchList.header.registeredAt")}
                </th>
                <th className="p-2 min-w-[50px]" scope="col">
                  {t("common.first")}
                </th>
                <th className="p-2 min-w-[50px]" scope="col">
                  {t("common.second")}
                </th>
                <th className="p-2 min-w-[50px]" scope="col">
                  {t("matchList.header.winner")}
                </th>
                <th className="p-2 min-w-[60px]" scope="col">
                  {t("common.ratio")}
                </th>
                <th className="p-2 min-w-[100px]" scope="col">
                  {t("matchList.header.matchDate")}
                </th>
                <th className="p-2" scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {displayMatches.map((m, i) => {
                // matches は App.tsx 最新順（createdAt 降順）にソートされている前提で、
                // 全件の中での連番を計算
                const displayIndex =
                  matches.length - (effectivePage - 1) * pageSize - i;
                const own = showOwnMark(m);
                return (
                  <tr
                    key={m.id}
                    className={`border-t border-zinc-800 text-center ${
                      i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-950"
                    }${own ? " ring-1 ring-inset ring-blue-600/40" : ""}`}
                  >
                    <td className="p-2">
                      <span className="inline-flex items-center gap-1">
                        {displayIndex}
                        {own && (
                          <span className="rounded bg-blue-600/20 px-1 text-[10px] text-blue-300">
                            {t("matchList.ownBadge")}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-2">{formatDate(m.createdAt)}</td>
                    <td
                      className={`p-2 ${
                        m.winner === "FIRST"
                          ? "font-bold text-white"
                          : "text-zinc-300"
                      }`}
                    >
                      {m.first.join(", ")}
                    </td>
                    <td
                      className={`p-2 ${
                        m.winner === "SECOND"
                          ? "font-bold text-white"
                          : "text-zinc-300"
                      }`}
                    >
                      {m.second.join(", ")}
                    </td>
                    <td className="p-2">
                      {m.winner === "FIRST"
                        ? t("common.first")
                        : t("common.second")}
                    </td>
                    <td className="p-2">{m.ratio ? "◯" : ""}</td>
                    <td className="p-2">{formatCalendarDate(m.matchDate)}</td>
                    <td className="p-2 min-w-[80px]">
                      {!isOwn(m) ? null : pendingDeleteId === m.id ? (
                        <span className="inline-flex gap-1">
                          <button
                            type="button"
                            ref={confirmButtonRef}
                            onClick={() => {
                              onRemove(m.id);
                              setPendingDeleteId(null);
                            }}
                            className="text-xs px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white"
                          >
                            {t("matchList.confirmDelete")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
                          >
                            {t("matchList.cancelDelete")}
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(m.id)}
                          disabled={!isRegistrationAllowed}
                          className={`text-xs px-2 py-1 rounded ${
                            isRegistrationAllowed
                              ? "text-red-400 hover:bg-red-900/30 hover:text-red-300"
                              : "text-zinc-600 cursor-not-allowed"
                          }`}
                        >
                          {t("matchList.delete")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayMatches.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-zinc-300">
                    {t("matchList.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Scroll affordance: fades in when there is more content below */}
          <div className="scroll-shadow-bottom" aria-hidden="true" />
        </div>
        {/* ページネーションコントロール (下部) */}
        <PaginationControls
          currentPage={effectivePage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageNumbers={pageNumbers}
          handlePageChange={handlePageChange}
          handlePageSizeChange={handlePageSizeChange}
          totalMatches={matches.length}
          label={t("matchList.paginationBottom")}
        />
      </div>
    );
  },
);

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
  // 上下 2 つの同一コントロールを SR 上で区別するためのランドマーク名。
  label: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  pageSize,
  pageNumbers,
  handlePageChange,
  handlePageSizeChange,
  totalMatches,
  label,
}) => {
  const { t } = useT();
  return (
    <nav
      aria-label={label}
      className="flex justify-between items-center text-xs mt-2 text-zinc-400"
    >
      {/* 表示件数選択 */}
      <div className="flex items-center space-x-2">
        <label className="text-zinc-200">
          {t("matchList.pageSize")}
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="bg-zinc-800 border border-zinc-700 rounded p-1 text-white"
          >
            {DISPLAY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ページネーションボタン */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          aria-label={t("matchList.prevPage")}
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
              type="button"
              onClick={() => handlePageChange(1)}
              className="px-2 py-1 rounded hover:bg-zinc-800/50"
            >
              1
            </button>
            {pageNumbers[0] > 2 && <span className="px-1">...</span>}
          </>
        )}

        {/* ページ番号ボタン */}
        {pageNumbers.map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => handlePageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`px-2 py-1 rounded ${
              page === currentPage
                ? "bg-blue-600 text-white font-bold"
                : "hover:bg-zinc-800/50"
            }`}
          >
            {page}
          </button>
        ))}

        {/* 最後のページへジャンプ */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-1">...</span>
            )}
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              className="px-2 py-1 rounded hover:bg-zinc-800/50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          aria-label={t("matchList.nextPage")}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-2 py-1 rounded disabled:text-zinc-600 hover:bg-zinc-800/50"
        >
          »
        </button>
      </div>

      {/* 現在のページ/総ページ数 */}
      <div className="text-zinc-300 text-sm">
        {/* matches.length を totalMatches に置き換える */}
        {totalMatches > 0
          ? t("matchList.pageStatus", {
              current: currentPage,
              total: totalPages,
            })
          : t("common.noData")}
      </div>
    </nav>
  );
};
