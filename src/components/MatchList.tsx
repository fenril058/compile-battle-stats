import React, { useMemo, useState } from "react";
import type { Match } from "../types";

type MatchListProps = {
  matches: Match[];
  onRemove: (id: string) => void;
  isRegistrationAllowed: boolean;
};

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
  const [showAll, setShowAll] = useState(false);
  // Optimization: Only render first 100 unless requested
  const displayMatches = useMemo(() => {
    if (showAll) return matches;
    return matches.slice(0, 100); // Assumes matches are already sorted NEWEST first
  }, [matches, showAll]);

  return (
    <div className="bg-zinc-900 p-3 rounded-2xl overflow-x-auto mb-6">
      <h2 className="font-semibold mb-2 text-center"
      >
         登録試合一覧({matches.length})
      </h2>
      <table className="text-xs w-full border-collapse">
        <thead className="bg-zinc-800 text-zinc-300">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2 min-w-[100px]">登録日</th>
            <th className="p-2">先攻</th>
            <th className="p-2">後攻</th>
            <th className="p-2">勝者</th>
            <th className="p-2">レシオ</th>
            <th className="p-2 min-w-[100px]">対戦日</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {displayMatches.map((m, i) => {
            // matches は App.tsx で最新順（createdAt 降順）にソートされているため、
            // 配列の要素数から現在のインデックスを引くと、古い順の番号になる。
            // 例: (要素数5 - インデックス0) = 5番, (要素数5 - インデックス4) = 1番
            const displayIndex = matches.length - i;
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
                <td className="p-2">
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
        </tbody>
      </table>
      {!showAll && matches.length > 100 && (
        <div className="text-center mt-2">
          <button onClick={() => setShowAll(true)} className="text-blue-400 text-xs hover:underline"
          >
             Show All {matches.length} Matches
          </button>
        </div>
      )}
    </div>
  );
});
