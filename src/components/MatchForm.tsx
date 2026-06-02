import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { ProtocolGroup } from "../config";
import { useAuth } from "../hooks/useAuth";
import type { Protocol, Trio, Winner } from "../types";
import { parseCalendarDate, todayInputValue } from "../utils/date";
import { ProtocolSelect } from "./ProtocolSelect";

type MatchFormProps = {
  protocolGroups: readonly ProtocolGroup[];
  onAddMatch: (data: {
    first: Trio;
    second: Trio;
    winner: Winner;
    matchDate: number | null;
    userId?: string;
  }) => void;
  isRegistrationAllowed: boolean;
  onSyncLocal?: () => void;
  mode: string;
  ratioSum: (t: Trio) => number;
};

// Initial state helpers (コンポーネントの初回マウント時のみ使用される)
// いずれも妥当な Protocol。タプル化のための as Trio（as unknown は不要 → #73）。
const INITIAL_FIRST: Trio = ["DARKNESS", "FIRE", "HATE"] as Trio;
const INITIAL_SECOND: Trio = ["PSYCHIC", "GRAVITY", "WATER"] as Trio;

export const MatchForm: React.FC<MatchFormProps> = ({
  protocolGroups,
  onAddMatch,
  isRegistrationAllowed,
  onSyncLocal,
  ratioSum,
  mode,
}) => {
  const { user, isAuthEnabled } = useAuth();
  const [first, setFirst] = useState<Trio>(INITIAL_FIRST);
  const [second, setSecond] = useState<Trio>(INITIAL_SECOND);
  // 日付入力用のステート (初期値は今日。ローカル暦日)
  const [dateInput, setDateInput] = useState<string>(todayInputValue());

  // === バリデーションロジックの修正 ===
  const isFormValid = (() => {
    // 1. プロトコルが3つずつ選択されていること (lengthチェック)
    if (first.length !== 3 || second.length !== 3) return false;

    // 2. 先攻と後攻で同じプロトコルが使われていないこと
    // (これは統計ロジックが排除すべきことなので、ここでは許容する)

    // 3. フォームが有効な状態であれば True
    return true;
  })();

  // チーム内プロトコル重複チェック関数
  const hasDuplicateProtocols = useCallback((trio: Trio): boolean => {
    // Trio の要素数が3つではない場合、重複チェックは行わない（バリデーション済みのため）
    if (trio.length !== 3) return false;

    // Setを使ってユニークな要素数をチェックし、3未満であれば重複あり
    return new Set(trio).size < 3;
  }, []);

  // チーム間プロトコル重複チェック
  // firstのいずれかの要素がsecondに含まれているかを確認
  const hasInterTeamDuplication = first.some((p) => second.includes(p));

  // === useEffect: プロトコル変更時のリセット処理 ===
  useEffect(() => {
    const flat = protocolGroups.flatMap((g) => [
      ...g.protocols,
    ]) as readonly Protocol[];
    if (flat.length >= 3) {
      setFirst(flat.slice(0, 3) as Trio);
      const secondStart =
        flat.length >= 6 ? flat.slice(3, 6) : flat.slice(0, 3);
      setSecond(secondStart as Trio);
    } else {
      // プロトコルが3つ未満という到達しない構成への退避。
      // 空文字（非 Protocol）を捏造せず、妥当な既定 Trio を維持する（#73）。
      setFirst(INITIAL_FIRST);
      setSecond(INITIAL_SECOND);
    }
  }, [protocolGroups]);

  const handleProtocolChange =
    (side: "FIRST" | "SECOND", index: number) => (v: Protocol) => {
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
    // 認証が有効（remote）なときのみログインを要求する。
    // local ハーネスは認証無効なので、ログイン不要で登録できる（#48 B）。
    if (isAuthEnabled && !user) {
      toast.error("ログインが必要です");
      return;
    }
    if (!isRegistrationAllowed) {
      toast.error("このシーズンは登録が許可されていません。");
      return;
    }
    if (!isFormValid) {
      toast.error("プロトコルが正しく選択されていません。");
      return;
    }

    // チーム内重複 (統計除外: 強い警告) のチェック
    const hasIntraTeamDuplication =
      hasDuplicateProtocols(first) || hasDuplicateProtocols(second);

    // ★ 重複がある場合の二重確認ロジック
    if (hasIntraTeamDuplication) {
      // Scenario 1: チーム内重複 - 統計から除外されるため、強い警告
      const confirmationMessage =
        "【重要】チーム内のプロトコルに重複があります。この試合データは統計計算から除外されますが、登録してよろしいですか？\n\n[OK]：登録を続行\n[キャンセル]：入力を修正";
      // window.confirm を使用してユーザーに確認を求める
      const userConfirmed = window.confirm(confirmationMessage);
      if (!userConfirmed) {
        // キャンセルされた場合、処理を中断
        toast.info("試合登録をキャンセルしました。入力を修正してください。");
        return;
      }
    } else if (hasInterTeamDuplication) {
      // Scenario 2: チーム間重複 - 統計に反映されるが、意図せぬ入力の可能性
      const confirmationMessage =
        "警告：先攻と後攻のプロトコルが重複しています（例: A, B, C vs C, D, E）。この試合は統計に反映されますが、意図した入力かご確認ください。\n\n[OK]：登録を続行\n[キャンセル]：入力を修正";

      const userConfirmed = window.confirm(confirmationMessage);

      if (!userConfirmed) {
        toast.info(
          "試合登録をキャンセルしました。（チーム間重複を修正してください）",
        );
        return;
      }
    }

    // 日付文字列(YYYY-MM-DD)を暦日として UTC 真夜中の timestamp に変換する（#69）。
    // 不正・未入力なら null。
    const matchDateTimestamp = parseCalendarDate(dateInput);

    // 親コンポーネントへ渡す
    onAddMatch({
      first,
      second,
      winner,
      matchDate: matchDateTimestamp,
      userId: user?.uid,
    });
  };

  return (
    <>
      {!isRegistrationAllowed ? (
        <div className="flex justify-center items-center h-24 border border-red-700 rounded-xl bg-red-950/20">
          <p className="text-xl font-bold text-red-400">
            登録期間が終了しました
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 p-4 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-center">
            試合結果の入力
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
            {/* First Side */}
            <fieldset className="flex flex-col items-center p-2 border border-zinc-700 rounded-xl">
              <legend className="text-center font-semibold mb-2">先攻</legend>
              {first.map((p, i) => (
                <ProtocolSelect
                  // biome-ignore lint/suspicious/noArrayIndexKey: position is fixed (always 3 slots)
                  key={`first-${i}`}
                  value={p}
                  onChange={handleProtocolChange("FIRST", i)}
                  protocolGroups={protocolGroups}
                  disabled={!isRegistrationAllowed}
                  ariaLabel={`先攻の ${i + 1} 番目の選択`}
                />
              ))}
              <p className="text-xs text-center text-zinc-400 mt-1">
                レシオ: {ratioSum(first)}
              </p>
            </fieldset>

            {/* Second Side */}
            <fieldset className="flex flex-col items-center p-2 border border-zinc-700 rounded-xl">
              <legend className="text-center font-semibold mb-2">後攻</legend>
              {second.map((p, i) => (
                <ProtocolSelect
                  // biome-ignore lint/suspicious/noArrayIndexKey: position is fixed (always 3 slots)
                  key={`second-${i}`}
                  value={p}
                  onChange={handleProtocolChange("SECOND", i)}
                  protocolGroups={protocolGroups}
                  disabled={!isRegistrationAllowed}
                  ariaLabel={`後攻の ${i + 1} 番目の選択`}
                />
              ))}
              <p className="text-xs text-center text-zinc-400 mt-1">
                レシオ: {ratioSum(second)}
              </p>
            </fieldset>

            {/* Action Column */}
            <div
              className="col-span-2 md:col-span-1 flex flex-col justify-center items-center
              border border-zinc-700 rounded-xl p-3 gap-3"
            >
              {/* 日付選択 UI */}
              <div className="flex justify-center mb-4 mt-2">
                <div className="flex flex-col items-center">
                  <label
                    htmlFor="match-date"
                    className="text-xs text-zinc-400 mb-1"
                  >
                    対戦日 (任意)
                  </label>
                  <input
                    id="match-date"
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    disabled={!isRegistrationAllowed}
                    className="w-full bg-zinc-300 border border-zinc-700 rounded px-2 py-1
                    text-sm text-zinc-800"
                  />
                </div>
              </div>

              {/* 左右入れ替えボタン */}
              <button
                onClick={handleSwap}
                type="button"
                className="w-1/2 text-sm text-zinc-400 border border-zinc-600 px-2 py-1 rounded
                hover:bg-zinc-800 mb-1"
              >
                🔄 入れ替え
              </button>

              {/* WIN ボタン */}
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleSubmit("FIRST")}
                  disabled={!isFormValid || !isRegistrationAllowed}
                  className="py-2 px-4 rounded-lg text-white bg-green-800
                  hover:bg-green-700 disabled:bg-zinc-700 text-sm font-bold"
                >
                  先攻WIN
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("SECOND")}
                  disabled={!isFormValid || !isRegistrationAllowed}
                  className="py-2 px-4 rounded-lg text-white bg-green-800
                  hover:bg-green-700 disabled:bg-zinc-700 text-sm font-bold"
                >
                  後攻WIN
                </button>
              </div>
              {mode === "local" && onSyncLocal && (
                <button
                  type="button"
                  onClick={onSyncLocal}
                  className="px-3 py-1 mt-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-700"
                >
                  ローカル再読込
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
