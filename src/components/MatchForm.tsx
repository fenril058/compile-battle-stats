// src/components/MatchForm.tsx
import React, { useState, useEffect } from "react"; // ★ useEffectをインポート
import { toast } from 'react-toastify'; // toastは handleSubmit 内で使用されているため
import type { Protocol, Trio, Winner } from "../types";

type MatchFormProps = {
  protocols: Protocol[];
  onAddMatch: (data: { first: Trio; second: Trio; winner: Winner }) => void;
  isRegistrationAllowed: boolean;
  onSyncLocal?: () => void;
  mode: string;
  ratioSum: (t: Trio) => number;
};

// Initial state helpers (コンポーネントの初回マウント時のみ使用される)
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

  // ★ FIX: protocols（シーズン）が変更されたときに状態をリセットする
  useEffect(() => {
    // 新しいプロトコルリストが有効であることを確認
    if (protocols.length >= 3) {
      // 新しいプロトコルリストの最初の3つをfirstに設定
      setFirst(protocols.slice(0, 3) as Trio);

      // secondは、リストが6つ以上あれば次の3つ、なければ最初の3つを設定
      const secondStart = protocols.length >= 6
        ? protocols.slice(3, 6)
        : protocols.slice(0, 3);

      setSecond(secondStart as Trio);
    } else {
        // プロトコルが不足している場合、無効なプロトコル名が入らないよう空のTrioを設定（安全策）
        setFirst(["", "", ""] as unknown as Trio);
        setSecond(["", "", ""] as unknown as Trio);
    }
  }, [protocols]); // protocols が変わるたびに実行される

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

  // フォームのバリデーション: 全てが null/空文字列でなく、かつ protocols に含まれていること
  const isFormValid =
    protocols.length > 0 &&
    first.every((p) => p && protocols.includes(p)) &&
    second.every((p) => p && protocols.includes(p));

  const handleSubmit = (winner: Winner) => {
    if (!isRegistrationAllowed) {
      toast.error("このシーズンは登録が許可されていません。");
      return;
    }
    if (!isFormValid) {
      toast.error("プロトコルが正しく選択されていません。");
      return;
    }

    // onAddMatch には Trio のデータ全体を渡す
    onAddMatch({ first, second, winner });
  };

  // 登録不可メッセージ
  const registrationDisabledMessage = isRegistrationAllowed ? null : (
    <div className="text-center text-red-400 py-2 border border-red-900 rounded-lg mb-4">
      このシーズンは新しい試合の登録が許可されていません。
    </div>
  );

  return (
    <div className="bg-zinc-900 p-4 rounded-2xl shadow-xl">
      <h2 className="text-xl font-semibold mb-4 text-center">試合結果の入力</h2>
      {registrationDisabledMessage}

      <div className="grid grid-cols-3 gap-3 md:gap-8">
        {/* First Side */}
        <div className="flex flex-col items-center p-2 border border-zinc-700 rounded-xl">
          <h3 className="font-semibold mb-2">先攻</h3>
          {first.map((p, i) => (
            <select
              key={`first-${i}`}
              value={p}
              onChange={handleSelect("FIRST", i)}
              disabled={!isRegistrationAllowed}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm mb-1"
            >
              {/* UIの選択肢はprotocolsから生成される */}
              {protocols.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          ))}
          <p className="text-xs text-center text-zinc-400 mt-1">レシオ: {ratioSum(first)}</p>
        </div>

        {/* Second Side */}
        <div className="flex flex-col items-center p-2 border border-zinc-700 rounded-xl">
          <h3 className="font-semibold mb-2">後攻</h3>
          {second.map((p, i) => (
            <select
              key={`second-${i}`}
              value={p}
              onChange={handleSelect("SECOND", i)}
              disabled={!isRegistrationAllowed}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm mb-1"
            >
              {/* UIの選択肢はprotocolsから生成される */}
              {protocols.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          ))}
          <p className="text-xs text-center text-zinc-400 mt-1">レシオ: {ratioSum(second)}</p>
        </div>

        {/* Action Column */}
        <div className="flex flex-col justify-center items-center border border-zinc-700 rounded-xl p-2 gap-2">
          {/* 左右入れ替えボタン */}
          <button onClick={handleSwap}
            className="text-xs text-zinc-400 border border-zinc-600 px-2 py-1 rounded hover:bg-zinc-800 mb-1"
          >
             🔄 入れ替え
          </button>

          {/* WIN ボタン */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleSubmit("FIRST")}
              disabled={!isFormValid || !isRegistrationAllowed}
              className="py-2 px-4 rounded-lg bg-green-600
              hover:bg-green-700 disabled:bg-zinc-700 text-sm font-bold"
            >
               先攻WIN
            </button>
            <button
              onClick={() => handleSubmit("SECOND")}
              disabled={!isFormValid || !isRegistrationAllowed}
              className="py-2 px-4 rounded-lg bg-green-600
              hover:bg-green-700 disabled:bg-zinc-700 text-sm font-bold"
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
