import type React from "react";
import { MIN_GAMES_FOR_MATRIX } from "../config";
import type { MatchupPair } from "../utils/logic";

type MatrixPairListProps = {
  pairs: readonly MatchupPair[];
};

// 相性表（行列）の別表現。MIN_GAMES到達の有向ペアだけを縦持ちで並べる。
// 疎な相性表（全試合 30×30 など）で巨大な空セルを描かずに済む実験的ビュー。
export const MatrixPairList: React.FC<MatrixPairListProps> = ({ pairs }) => {
  if (pairs.length === 0) {
    return (
      <p className="text-xs text-zinc-500 text-center py-4">
        {MIN_GAMES_FOR_MATRIX} 戦以上の対戦ペアがまだありません
      </p>
    );
  }

  return (
    <table className="text-xs w-full border border-zinc-800">
      <caption className="sr-only">
        出現ペア一覧（{MIN_GAMES_FOR_MATRIX} 戦以上）
      </caption>
      <thead className="bg-zinc-800 text-zinc-300">
        <tr>
          <th className="p-1" scope="col">
            #
          </th>
          <th className="p-1" scope="col">
            攻
          </th>
          <th className="p-1" scope="col">
            受
          </th>
          <th className="p-1" scope="col">
            G
          </th>
          <th className="p-1" scope="col">
            W
          </th>
          <th className="p-1" scope="col">
            L
          </th>
          <th className="p-1" scope="col">
            %
          </th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((pr, i) => (
          <tr
            key={`${pr.a}__${pr.b}`}
            className={`border-t border-zinc-800 text-center ${
              pr.p > 60 ? "bg-green-900/30" : pr.p < 40 ? "bg-red-900/30" : ""
            }`}
          >
            <td className="p-1">{i + 1}</td>
            <td className="p-1">{pr.a}</td>
            <td className="p-1">{pr.b}</td>
            <td className="p-1">{pr.g}</td>
            <td className="p-1">{pr.w}</td>
            <td className="p-1">{pr.l}</td>
            <td className="p-1">{pr.p.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
