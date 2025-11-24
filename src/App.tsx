import React, { useEffect, useMemo, useState } from "react";
import { useFirestore } from "./hooks/useFirestore";
import { PROTOCOLS_FULL, ABBR, RATIOS } from "./types";
import type { Protocol, Trio, Match } from "./types";
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  ratioSum,
  isRatioBattle,
  makeStats,
  rows,
  matchup
} from "./utils/logic";

const COLLECTIONNAME = "compile_season1_aux"

const MOCK_KEY = "compile_season2_public_mock";


//  RATIOS定数から表を生成
const RatioTable: React.FC = () => {
  // PROTOCOLS_FULL の順を維持しつつ、RATIOS でグルーピング
  const groups = useMemo(() => {
    const map = new Map<number, Protocol[]>();
    for (const p of PROTOCOLS_FULL) {
      const score = RATIOS[p] ?? 0;
      const list = map.get(score) ?? [];
      list.push(p);
      map.set(score, list);
    }
    // 表示順：点数の降順（例：5,3,2,1,0）
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([score, list]) => ({ score, list }));
  }, []);
  return (
    <div className="mt-3 bg-zinc-900 p-3 rounded-2xl text-center">
      <h2 className="font-semibold mb-3 text-center">レシオ表</h2>
      <div className="text-sm leading-6 text-left mx-auto max-w-screen-sm">
        {groups.map(({ score, list }) => (
          <div key={score}>
            {score}点: {list.join(", ")}
          </div>
        ))}
      </div>
    </div>
  );
};

const Stat: React.FC<{ t: string; m: any; color: string }> = ({ t, m, color }) => {
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

const Matrix: React.FC<{ t: string; m: any; bg: string }> = ({ t, m, bg }) => (
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

export default function App() {
  // フックを初期化（コレクション名と localStorage キー）
  const {
    mode,
    items: matches,
    add: addMatchItem,
    remove: removeMatchItem,
    reloadLocal,
  } = useFirestore<Match>(COLLECTIONNAME, MOCK_KEY);

  // === 認証状態管理（3. Firebase Authentication）===
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);
  const login = async () => {
    if (!auth) {
      alert("Firebaseが未初期化のためログインできません（.env を確認）");
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    };

 // 画面側の入力状態
  const [left, setLeft] = useState<Trio>(["DARKNESS", "FIRE", "HATE"]);
  const [right, setRight] = useState<Trio>(["PSYCHIC", "GRAVITY", "WATER"]);
  const [winner, setWinner] = useState<"L" | "R">("L");

  // 追加（ratio は画面側で計算し、add には id なしで渡す）
  const addMatch = () => {
    const payload = {
      left,
      right,
      winner,
      ratio: isRatioBattle(left, right),
    };
    void addMatchItem(payload);
  };

  // 削除
  const removeMatch = (id: string) => {
    if (window.confirm("本当に？"))
      {
        void removeMatchItem(id);
      }
  };

  const syncLocal = () => {
    try {
      reloadLocal();
      alert("ローカルデータを再読込しました");
    } catch {
      alert("ローカルデータの読込に失敗しました");
    }
  };

  const handleSelect =
    (side: "L" | "R", index: number) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value as Protocol;
      if (side === "L") {
        setLeft((prev) => {
          const next: Trio = [...prev];
          next[index] = v;
          return next;
        });
      } else {
        setRight((prev) => {
          const next: Trio = [...prev];
          next[index] = v;
          return next;
        });
      }
    };

  const normalMatches = useMemo(
    () => matches.filter((m) => !m.ratio),
    [matches]
  );
  const ratioMatches = useMemo(
    () => matches.filter((m) => m.ratio),
    [matches]
  );

  const as = useMemo(() => makeStats(matches), [matches]);
  const ns = useMemo(
    () => makeStats(normalMatches),
    [normalMatches]
  );
  const rs = useMemo(
    () => makeStats(ratioMatches),
    [ratioMatches]
  );

  const amat = useMemo(() => matchup(matches), [matches]);
  const nmat = useMemo(
    () => matchup(normalMatches),
    [normalMatches]
  );
  const rmat = useMemo(
    () => matchup(ratioMatches),
    [ratioMatches]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-0">
      <div className="p-3 border-b border-zinc-800">
        <div className="text-xs text-zinc-400 text-center">
        モード: {mode === "remote" ? "Firebase" : "ローカル(localStorage)"}
          {/* 認証状態の簡易表示 */}
          <span className="ml-2">
            / ユーザー: {user ? user.displayName ?? user.email ?? "ログイン中" : "未ログイン"}
          </span>
        </div>
        {/* 認証ボタン（3. Authentication UI） */}
        <div className="flex justify-center gap-2 my-2">
          {user ? (
            <button
              onClick={logout}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded text-sm"
            >
              ログアウト
            </button>
          ) : (
            <button
              onClick={login}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded text-sm"
            >
              Googleでログイン
            </button>
          )}
        </div>
        <h2 className="text-base font-semibold mb-2 text-center">
          試合登録
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          {[{ label: "先攻", side: "L" as const }, { label: "後攻", side: "R" as const }].map(
            ({ label, side }) => (
              <div
                key={side}
                className="border border-zinc-700 rounded-xl p-2"
              >
                <p className="text-sm text-zinc-400 mb-1 text-center">
                  {label}
                </p>
                {(side === "L" ? left : right).map((p, i) => (
                  <select
                    key={`${side}-${i}`}
                    value={p}
                    onChange={handleSelect(side, i)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm mb-1 focus:ring-2 focus:ring-blue-500"
                  >
                    {PROTOCOLS_FULL.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                ))}
                <p className="text-xs text-center text-zinc-400 mt-1">
                  合計レシオ: {ratioSum(side === "L" ? left : right)}
                </p>
              </div>
            )
          )}

          <div className="flex flex-col justify-center items-center border border-zinc-700 rounded-xl p-2 gap-2">
            <p className="text-sm text-zinc-400">勝者</p>
            <div className="flex gap-2">
              <button
                onClick={() => setWinner("L")}
                className={`px-3 py-2 rounded text-sm font-semibold ${
                  winner === "L"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                先攻
              </button>
              <button
                onClick={() => setWinner("R")}
                className={`px-3 py-2 rounded text-sm font-semibold ${
                  winner === "R"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                後攻
              </button>
            </div>
            <button
              onClick={addMatch}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              追加
            </button>
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={syncLocal}
                disabled={mode !== "local"}
                className={`px-3 py-2 rounded text-sm text-white ${
                  mode !== "local"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                 ローカルデータの読み込み
              </button>
            </div>
          </div>
        </div>

        <RatioTable />
      </div>

      <div className="p-3 md:p-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Stat t="通常戦 勝率" m={ns} color="bg-orange-950/40" />
          <Stat t="レシオ制 勝率" m={rs} color="bg-blue-950/40" />
          <Stat t="全試合 勝率" m={as} color="bg-green-950/40" />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Matrix
            t="通常戦 相性表(3試合以上)"
            m={nmat}
            bg="bg-orange-950/10"
          />
          <Matrix
            t="レシオ制 相性表(3試合以上)"
            m={rmat}
            bg="bg-blue-950/10"
          />
          <Matrix
            t="全試合 相性表(3試合以上)"
            m={amat}
            bg="bg-green-950/10"
          />
        </div>

        <div className="bg-zinc-900 p-3 rounded-2xl overflow-x-auto mb-6">
          <h2 className="font-semibold mb-2 text-center">
            登録試合一覧({matches.length})
          </h2>
          <table className="text-xs w-full border-collapse">
            <thead className="bg-zinc-800 text-zinc-300">
              <tr>
                <th>#</th>
                <th>先攻</th>
                <th>後攻</th>
                <th>勝者</th>
                <th>レシオ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr
                  key={m.id}
                  className="border-t border-zinc-800 text-center"
                >
                  <td>{i + 1}</td>
                  <td>{m.left.join(", ")}</td>
                  <td>{m.right.join(", ")}</td>
                  <td>{m.winner === "L" ? "先攻" : "後攻"}</td>
                  <td>{m.ratio ? "◯" : ""}</td>
                  <td>
                    <button
                      onClick={() => removeMatch(m.id)}
                      className="text-red-400 text-xs"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="text-center text-xs text-zinc-500 pb-3">
          2025 りゅー(
          <a
            href="https://x.com/suke69"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            @suke69
          </a>
                )
                & ril (
          <a
            href="https://x.com/fenril_nh"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            @fenril_nh
          </a>
          )
        </footer>
      </div>
    </div>
  );
}
