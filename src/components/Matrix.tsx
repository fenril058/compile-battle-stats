import type React from "react";
import { ABBR, MIN_GAMES_FOR_MATRIX } from "../config";
import type { MatrixData, Protocol } from "../types";

type MatrixProps = {
  t: string;
  m: MatrixData;
  bg: string;
  protocols: readonly Protocol[];
};

export const Matrix: React.FC<MatrixProps> = ({ t, m, bg, protocols }) => (
  <div className={`p-4 rounded-2xl mb-6 ${bg}`}>
    <h2 className="text-lg font-semibold mb-2 text-center">
      {t}（{MIN_GAMES_FOR_MATRIX} 戦以上）
    </h2>
    <div
      className="relative overflow-x-auto overflow-x-auto max-h-[500px]
    border border-zinc-800 rounded-md"
    >
      <table className="w-full text-xs min-w-[300px]">
        <thead className="sticky top-0 z-20 bg-zinc-800 text-zinc-300">
          <tr>
            <th className="px-2 py-1 sticky left-0 z-10 bg-zinc-800">PRO</th>
            {protocols.map((p) => (
              <th key={`h-${p}`} className="px-2 py-1">
                {ABBR[p] ?? p.slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {protocols.map((a) => (
            <tr key={`r-${a}`}>
              <th className="bg-zinc-800 px-2 py-1 sticky left-0 z-10 bg-zinc-800">
                {ABBR[a] ?? a.slice(0, 3)}
              </th>
              {protocols.map((b) => {
                const row = m[a];
                const v = row ? row[b] : null;

                if (v === null || v === undefined) {
                  return (
                    <td
                      key={`c-${a}-${b}`}
                      className="p-1 text-zinc-700 text-center"
                    >
                      –
                    </td>
                  );
                }
                const tone =
                  v > 60
                    ? "bg-green-700/40"
                    : v < 40
                      ? "bg-red-700/40"
                      : "bg-zinc-700/40";
                return (
                  <td key={`c-${a}-${b}`} className={`p-1 text-center ${tone}`}>
                    {v.toFixed(0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
