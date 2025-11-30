import React, { useState, useEffect } from "react";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* 左側・右側セレクター (2 columns) */}
        {[{ label: "先攻", side: "FIRST" as const, data: first },
          { label: "後攻", side: "SECOND" as const, data: second }].map(
            ({ label, side, data }) => (
              <div key={side} className="border border-zinc-700 rounded-xl p-2 relative">
                <p className="text-sm text-zinc-400 mb-1 text-center">{label}</p>
                {data.map((p, i) => (
                  <select
                    key={`${side}-${i}`}
                    value={p}
                    onChange={handleSelect(side, i)}
                    className="w-full bg-zinc-800 border border-zinc-700
                    rounded p-2 text-sm mb-1 focus:ring-2 focus:ring-blue-500"
                  >
                    {protocols.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                ))}
                <p className="text-xs text-center text-zinc-400 mt-1"
                >
                   合計レシオ: {ratioSum(data)}
                </p>
              </div>
            )
          )}

        {/* アクションエリア (1 column) */}
        <div className="flex flex-col justify-center items-center border border-zinc-700 rounded-xl p-2 gap-2">
          {/* 左右入れ替えボタン */}
          <button
            onClick={handleSwap}
            className="text-xs text-zinc-400 border border-zinc-600 px-2 py-1 rounded hover:bg-zinc-800 mb-1"
          >
             🔄 先後入れ替え
          </button>

          {/* WIN ボタン */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onAddMatch("FIRST")}
              className="py-2 px-4 rounded-lg transition-colors bg-green-600
              hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-sm font-bold"
              disabled={!isFormValid}
            >
               先攻WIN
            </button>
            <button
              onClick={() => onAddMatch("SECOND")}
              className="py-2 px-4 rounded-lg transition-colors bg-green-600
              hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-sm font-bold"
              disabled={!isFormValid}
            >
               後攻WIN
            </button>
          </div>

          {mode === "local" && onSyncLocal && (
            <button
              onClick={onSyncLocal}
              className="px-3 py-1 mt-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-700"
            >
               ローカル再読込
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
