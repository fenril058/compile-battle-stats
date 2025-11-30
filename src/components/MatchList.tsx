import React, { useMemo, useState } from "react";
import type { Match } from "../types";

type MatchListProps = {
  matches: Match[];
  onRemove: (id: string) => void;
  isRegistrationAllowed: boolean;
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
      <h2 className="font-semibold mb-2 text-center">
        登録試合一覧({matches.length})
      </h2>
      <table className="text-xs w-full border-collapse">
        <thead className="bg-zinc-800 text-zinc-300">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">先攻</th>
            <th className="p-2">後攻</th>
            <th className="p-2">勝者</th>
            <th className="p-2">レシオ</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m, i) => (
            <tr
              key={m.id}
              className={`border-t border-zinc-800 text-center ${
                i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-950"
              }`}
            >
              <td className="p-2">{i + 1}</td>
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
                <button
                  onClick={() => onRemove(m.id)}
                  disabled={!isRegistrationAllowed}
                  className={`text-xs px-2 py-1 rounded ${
                    isRegistrationAllowed
                      ? "text-red-400 hover:bg-red-900/30 hover:text-red-300"
                      : "text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
