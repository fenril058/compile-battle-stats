import React from "react";
import { rows } from "../utils/logic";

export const Stat: React.FC<{ t: string; m: any; color: string }> = ({ t, m, color }) => {
  const sections = ["single", "pair", "trio", "first", "second"] as const;

  return (
    <div className={`p-3 rounded-2xl shadow-md ${color}`}>
      <h2 className="font-semibold mb-2 text-center">{t}</h2>
      {sections.map((key) => {
        const r = rows(m[key], key as any);
        if (!r.length) return null;
        return (
          <div key={key} className="mb-3">
            <h3 className="text-sm text-zinc-400 mb-1 text-center">{key}</h3>
            <table className="text-xs w-full border border-zinc-800">
              <thead className="bg-zinc-800 text-zinc-300">
                <tr>
                  <th>#</th>
                  <th>PROTOCOL</th>
                  <th>GAME</th>
                  <th>WIN</th>
                  <th>LOSE</th>
                  <th>WR(%)</th>
                </tr>
              </thead>
              <tbody>
                {r.map((v: any, i: number) => (
                  <tr
                    key={`${key}-${v.n}`}
                    className={`border-t border-zinc-800 text-center ${
                      v.p > 60
                        ? "bg-green-900/30"
                        : v.p < 40
                        ? "bg-red-900/30"
                        : ""
                    }`}
                  >
                    <td>{i + 1}</td>
                    <td>{v.n}</td>
                    <td>{v.g}</td>
                    <td>{v.w}</td>
                    <td>{v.l}</td>
                    <td>{v.p.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};
