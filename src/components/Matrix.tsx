import React from "react";
import { PROTOCOLS_FULL, ABBR } from "../types";

export const Matrix: React.FC<{ t: string; m: any; bg: string }> = ({ t, m, bg }) => (
  <div className={`p-4 rounded-2xl mb-6 ${bg}`}>
    <h2 className="text-lg font-semibold mb-2 text-center">{t}</h2>
    <table className="w-full text-xs border border-zinc-800 rounded-md overflow-hidden">
      <thead className="bg-zinc-800 text-zinc-300">
        <tr>
          <th className="px-2 py-1">PRO</th>
          {PROTOCOLS_FULL.map((p) => (
            <th key={`h-${p}`} className="px-2 py-1">
              {ABBR[p]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PROTOCOLS_FULL.map((a) => (
          <tr key={`r-${a}`}>
            <th className="bg-zinc-800 px-2 py-1">{ABBR[a]}</th>
            {PROTOCOLS_FULL.map((b) => {
              const v = m[a][b];
              if (v === null) {
                return (
                  <td key={`c-${a}-${b}`} className="p-1 text-zinc-700">
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
                <td
                  key={`c-${a}-${b}`}
                  className={`p-1 text-center ${tone}`}
                >
                  {v.toFixed(1)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
