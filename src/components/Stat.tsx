import React from "react";
import { rows } from "../utils/logic";
import type { StatsResult } from "../types";

// SideStats型を利用して、mの型を具体化
type StatProps = {
  t: string;
  m: StatsResult;
  color: string;
  minPair: number;
  minTrio: number;
};

const STAT_HEADERS = {
  single: "プロトコル単体勝率",
  pair: "プロトコル2枚組勝率",
  trio: "プロトコル3枚組勝率",
  first: "1枠目配置勝率",
  second: "2枠目配置勝率",
} as const;

const sectionKeys = Object.keys(STAT_HEADERS) as Array<keyof typeof STAT_HEADERS>;

export const Stat: React.FC<StatProps> = ({ t, m, color, minPair, minTrio }) => {
  return (
    <div className={`p-3 rounded-2xl shadow-md ${color}`}>
      <h2 className="font-semibold mb-2 text-center">{t}</h2>
      {sectionKeys.map((key) => {
        // m[key] が存在するかチェック
        if (!m || !m[key]) return null;

        const r = rows(m[key], key, minPair, minTrio);
        if (!r.length) return null;

        return (
          <div key={key} className="mb-3">
            <h3 className="text-sm text-zinc-400 mb-1 text-center">
              {STAT_HEADERS[key]}
            </h3>
            <table className="text-xs w-full border border-zinc-800">
              <thead className="bg-zinc-800 text-zinc-300">
                <tr>
                  <th className="p-1">#</th>
                  <th className="p-1">PROTOCOL</th>
                  <th className="p-1">GAME</th>
                  <th className="p-1">WIN</th>
                  <th className="p-1">LOSE</th>
                  <th className="p-1">WR(%)</th>
                </tr>
              </thead>
              <tbody>
                {r.map((v: any, i: number) => ( // rowsの戻り値型が不明なため、ここだけany許容か、logic側で型定義が必要
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
                    <td className="p-1">{i + 1}</td>
                    <td className="p-1">{v.n}</td>
                    <td className="p-1">{v.g}</td>
                    <td className="p-1">{v.w}</td>
                    <td className="p-1">{v.l}</td>
                    <td className="p-1">{v.p.toFixed(1)}%</td>
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
