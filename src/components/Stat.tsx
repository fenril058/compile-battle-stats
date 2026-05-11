import React, { useMemo, useState } from "react";
import type { StatsResult } from "../types";
import { rows } from "../utils/logic";

type StatKey = keyof StatsResult;

const KEYS: readonly StatKey[] = ["single", "pair", "trio", "first", "second"];

const TAB_LABELS: Record<StatKey, string> = {
  single: "単体",
  pair: "2枚組",
  trio: "3枚組",
  first: "先攻",
  second: "後攻",
};

const SECTION_LABELS: Record<StatKey, string> = {
  single: "プロトコル単体勝率",
  pair: "プロトコル2枚組勝率",
  trio: "プロトコル3枚組勝率",
  first: "先攻時の勝率",
  second: "後攻時の勝率",
};

type StatProps = {
  t: string;
  m: StatsResult;
  color: string;
  minPair: number;
  minTrio: number;
};

export const Stat: React.FC<StatProps> = React.memo(
  ({ t, m, color, minPair, minTrio }) => {
    const [activeKey, setActiveKey] = useState<StatKey>("single");

    return (
      <div className={`p-3 rounded-2xl shadow-md ${color}`}>
        <h2 className="font-semibold mb-2 text-center">{t}</h2>
        <div className="flex flex-wrap gap-1 mb-3">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                activeKey === key
                  ? "bg-zinc-500 text-white font-medium"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>
        <StatSection
          label={SECTION_LABELS[activeKey]}
          data={m[activeKey]}
          type={activeKey}
          minPair={minPair}
          minTrio={minTrio}
        />
      </div>
    );
  },
);

type StatSectionProps = {
  label: string;
  data: StatsResult[StatKey];
  type: StatKey;
  minPair: number;
  minTrio: number;
};

const StatSection: React.FC<StatSectionProps> = ({
  label,
  data,
  type,
  minPair,
  minTrio,
}) => {
  const r = useMemo(() => {
    if (!data) return [];
    return rows(data, type, minPair, minTrio);
  }, [data, type, minPair, minTrio]);

  let displayLabel = label;
  if (type === "pair") {
    displayLabel = `${label}（${minPair}戦以上）`;
  } else if (type === "trio") {
    displayLabel = `${label}（${minTrio}戦以上）`;
  }

  return (
    <div>
      <h3 className="text-sm text-zinc-400 mb-1 text-center">{displayLabel}</h3>
      {r.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-4">データなし</p>
      ) : (
        <table className="text-xs w-full border border-zinc-800">
          <thead className="bg-zinc-800 text-zinc-300">
            <tr>
              <th className="p-1">#</th>
              <th className="p-1">PRO</th>
              <th className="p-1">G</th>
              <th className="p-1">W</th>
              <th className="p-1">L</th>
              <th className="p-1">%</th>
            </tr>
          </thead>
          <tbody>
            {r.map((v, i) => (
              <tr
                key={v.n}
                className={`border-t border-zinc-800 text-center ${v.p > 60 ? "bg-green-900/30" : v.p < 40 ? "bg-red-900/30" : ""}`}
              >
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
      )}
    </div>
  );
};
