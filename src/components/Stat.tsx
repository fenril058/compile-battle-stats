import React, { useMemo } from "react";
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

const KEYS = ["single", "pair", "trio", "first", "second"] as const;
const HEADERS: Record<string, string> = {
  single: "プロトコル単体勝率",
  pair: "プロトコル2枚組勝率",
  trio: "プロトコル3枚組勝率",
  first: "1枠目配置勝率",
  second: "2枠目配置勝率",
} as const;

export const Stat: React.FC<StatProps> = React.memo(({ t, m, color, minPair, minTrio }) => {
  return (
    <div className={`p-3 rounded-2xl shadow-md ${color}`}>
      <h2 className="font-semibold mb-2 text-center">{t}</h2>
      {KEYS.map((key) => (
        <StatSection
          key={key}
          label={HEADERS[key]}
          data={m[key]} // Pass specific subset
          type={key}
          minPair={minPair}
          minTrio={minTrio}
        />
      ))}
    </div>
  );
});

// ★ Split into sub-component for cleaner memoization
const StatSection = ({ label, data, type, minPair, minTrio }: any) => {
  // ★ CRITICAL: Memoize the sorting logic
  const r = useMemo(() => {
    if (!data) return [];
    return rows(data, type, minPair, minTrio);
  }, [data, type, minPair, minTrio]);

  if (!r.length) return null;

  return (
    <div className="mb-3">
      <h3 className="text-sm text-zinc-400 mb-1 text-center">{label}</h3>
      <table className="text-xs w-full border border-zinc-800">
        <thead className="bg-zinc-800 text-zinc-300">
           <tr>
             <th className="p-1">#</th><th className="p-1">PRO</th>
             <th className="p-1">G</th><th className="p-1">W</th>
             <th className="p-1">L</th><th className="p-1">%</th>
           </tr>
        </thead>
        <tbody>
          {r.map((v, i) => (
             <tr key={v.n} className={`border-t border-zinc-800 text-center ${v.p > 60 ? 'bg-green-900/30' : v.p < 40 ? 'bg-red-900/30' : ''}`}>
               <td className="p-1">{i + 1}</td>
               <td className="p-1">{v.n}</td>
               <td className="p-1">{v.g}</td>
               <td className="p-1">{v.w}</td>
               <td className="p-1">{v.l}</td>
               <td className="p-1">{v.p.toFixed(1)}</td>
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
