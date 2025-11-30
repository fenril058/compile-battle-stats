import React, { useState } from "react";
import type { Protocol, Trio, Winner } from "../types";

type MatchFormProps = {
  protocols: Protocol[];
  onAddMatch: (data: { first: Trio; second: Trio; winner: Winner }) => void;
  isRegistrationAllowed: boolean;
  onSyncLocal?: () => void;
  mode: string;
  ratioSum: (t: Trio) => number;
};

// Initial state helpers
const INITIAL_FIRST: Trio = ["DARKNESS", "FIRE", "HATE"] as unknown as Trio;
const INITIAL_SECOND: Trio = ["PSYCHIC", "GRAVITY", "WATER"] as unknown as Trio;

export const MatchForm: React.FC<MatchFormProps> = ({
  protocols,
  onAddMatch,
  isRegistrationAllowed,
  onSyncLocal,
  ratioSum,
  mode,
}) => {
  const [first, setFirst] = useState<Trio>(INITIAL_FIRST);
  const [second, setSecond] = useState<Trio>(INITIAL_SECOND);

  const handleSelect =
    (side: "FIRST" | "SECOND", index: number) =>
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value as Protocol;
        const setter = side === "FIRST" ? setFirst : setSecond;
        setter((prev) => {
          const next = [...prev] as Trio;
          next[index] = v;
          return next;
        });
      };

  const handleSwap = () => {
    setFirst(second);
    setSecond(first);
  };

  const handleSubmit = (winner: Winner) => {
    onAddMatch({ first, second, winner });
    // Optional: Reset form or keep selection? Usually keeping is better for repeated entry.
  };

  const isFormValid =
    first.every((p) => p !== null) && second.every((p) => p !== null);

  {/* ★ 登録期間終了の場合は専用メッセージを表示し、フォーム全体を隠す ★ */}
  if(!isRegistrationAllowed) {
    return(
      <div className="mb-3">
        <div className="flex justify-center items-center h-24 border border-red-700 rounded-xl bg-red-950/20">
          <p className="text-xl font-bold text-red-400"
          >
             登録期間が終了しました
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-3">
      {/*  通常の試合登録フォーム (3カラムグリッド) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <div className="border border-zinc-700 rounded-xl p-2 relative">
          <p className="text-sm text-zinc-400 mb-1 text-center">先攻</p>
          {first.map((p, i) => (
            <select
              key={`first-${i}`}
              value={p}
              onChange={handleSelect("FIRST", i)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm mb-1"
            >
              {protocols.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          ))}
          <p className="text-xs text-center text-zinc-400 mt-1">Sum: {ratioSum(first)}</p>
        </div>
        <div className="border border-zinc-700 rounded-xl p-2 relative">
          <p className="text-sm text-zinc-400 mb-1 text-center">後攻</p>
          {first.map((p, i) => (
            <select
              key={`second-${i}`}
              value={p}
              onChange={handleSelect("SECOND", i)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm mb-1"
            >
              {protocols.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          ))}
          <p className="text-xs text-center text-zinc-400 mt-1">Sum: {ratioSum(first)}</p>
        </div>

        {/* Action Column */}
        <div className="flex flex-col justify-center items-center border border-zinc-700 rounded-xl p-2 gap-2">
          <button onClick={handleSwap}
            className="text-xs text-zinc-400 border border-zinc-600 px-2 py-1 rounded hover:bg-zinc-800 mb-1"
          >
             🔄 入れ替え
          </button>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleSubmit("FIRST")}
              disabled={!isFormValid}
              className="py-2 px-4 rounded-lg bg-green-600
              hover:bg-green-700 disabled:bg-zinc-700 text-sm font-bold"
            >
               先攻WIN
            </button>
            <button
              onClick={() => handleSubmit("SECOND")}
              disabled={!isFormValid}
              className="py-2 px-4 rounded-lg bg-green-600
              hover:bg-green-700 disabled:bg-zinc-700 text-sm font-bold"
            >
               後攻WIN
            </button>
          </div>
          {mode === "local" && onSyncLocal && (
            <button onClick={onSyncLocal} className="text-xs text-blue-400 underline mt-2">Local Sync</button>
          )}
        </div>
      </div>
    </div>
  );
};
