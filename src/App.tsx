import React, { useEffect, useMemo, useState } from "react";
import { useFirestore } from "./hooks/useFirestore";
import { PROTOCOLS_FULL } from "./types";
import type { Protocol, Trio, Match } from "./types";
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

// 分離したロジックとコンポーネントをインポート
import { ratioSum, isRatioBattle, makeStats, matchup } from "./utils/logic";
import { RatioTable } from "./components/RatioTable";
import { Stat } from "./components/Stat";
import { Matrix } from "./components/Matrix";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LOCAL_STORAGE_KEY =
  import.meta.env.VITE_LOCAL_STORAGE_KEY || "compile_stats_local_data";

const MIN_GAMES_FOR_PAIR_STATS = 5; // pair (2枚組) の表示に必要な最小試合数
const MIN_GAMES_FOR_TRIO_STATS = 3; // trio (3枚組) の表示に必要な最小試合数

const SEASON_COLLECTIONS = [
  // "compile_season2_aux",
  // "compile_season2",
  "compile_season1_aux",
  "compile_season1",
] as const;
type Season = (typeof SEASON_COLLECTIONS)[number]; // 型定義を抽出


export default function App() {
  // 選択されたシーズンを状態として管理
  // 初期値はリストの最初、またはLocalStorageから取得
  const [selectedSeason, setSelectedSeason] = useState<Season>(
    (localStorage.getItem('selectedSeason') as Season) || SEASON_COLLECTIONS[0]
  );

  // 依存値が変わるたびにLocalStorageに保存する
  useEffect(() => {
    localStorage.setItem('selectedSeason', selectedSeason);
  }, [selectedSeason]);

  // === データ管理フック ===
  const {
    mode,
    items: matches,
    add: addMatchItem,
    remove: removeMatchItem,
    reloadLocal,
  } = useFirestore<Match>(selectedSeason, LOCAL_STORAGE_KEY);

  // === 認証状態管理 ===
  const [user, setUser] = useState<User | null>(null); // 修正済み

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

  // === UI入力状態 ===
  const [left, setLeft] = useState<Trio>(["DARKNESS", "FIRE", "HATE"]);
  const [right, setRight] = useState<Trio>(["PSYCHIC", "GRAVITY", "WATER"]);

  // === アクション ===
  const addMatch = (selectedWinner: "L" | "R") => {
    // チーム選択が完了しているか確認
    if (left.some(p => p === null) || right.some(p => p === null)) {
      toast.error("プロトコルをすべて選択してください");
      return;
    }
    // 登録ペイロードを作成
    const payload = {
      left,
      right,
      winner: selectedWinner,
      ratio: isRatioBattle(left, right), // logicから利用
    };
    void addMatchItem(payload);
  };

  const removeMatch = (id: string) => {
    if (window.confirm("本当に？")) {
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

  // === 統計計算 (logicを利用) ===
  const normalMatches = useMemo(
    () => matches.filter((m) => !m.ratio),
    [matches]
  );
  const ratioMatches = useMemo(
    () => matches.filter((m) => m.ratio),
    [matches]
  );

  const as = useMemo(() => makeStats(matches), [matches]);
  const ns = useMemo(() => makeStats(normalMatches), [normalMatches]);
  const rs = useMemo(() => makeStats(ratioMatches), [ratioMatches]);

  const amat = useMemo(() => matchup(matches), [matches]);
  const nmat = useMemo(() => matchup(normalMatches), [normalMatches]);
  const rmat = useMemo(() => matchup(ratioMatches), [ratioMatches]);

  // ★ 登録順 (タイムスタンプ昇順) に並び替えた試合一覧を作成
  const sortedMatches = useMemo(() => {
    // timestamp の昇順 (古いものが上、新しいものが下) でソートします。
    return [...matches].sort((a, b) => {
      // 1. タイムスタンプで比較
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp; // 古いものが上
      }
      // 2. タイムスタンプが同じ場合は ID をタイブレーカーとして利用 (文字列比較)
      // IDの文字列で昇順に並べることで、順序を安定させます。
      return a.id.localeCompare(b.id);
    });
  }, [matches]);

  // CSVエクスポート機能
  const exportToCsv = () => {
    // ヘッダー行 (types.tsのMatch型に依存)
    const headers = [
      "ID",
      "先攻プロトコル1",
      "先攻プロトコル2",
      "先攻プロトコル3",
      "後攻プロトコル1",
      "後攻プロトコル2",
      "後攻プロトコル3",
      "勝者(L/R)",
      "レシオ判定(T/F)",
      "タイムスタンプ",
    ];

    // データ行の作成
    const csvRows = matches.map(m => [
      m.id,
      ...m.left,
      ...m.right,
      m.winner,
      m.ratio ? 'TRUE' : 'FALSE',
      m.timestamp,
    ].map(field => `"${field}"`).join(',')); // 各フィールドをダブルクォートで囲み、CSV形式に

    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n');

    // BOM (Byte Order Mark) を追加して日本語文字化けを防ぐ
    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // ダウンロードリンクを作成・クリック
    const a = document.createElement('a');
    a.href = url;
    a.download = `compile_battle_stats_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success("CSVファイルをエクスポートしました");
  };

  // === レンダリング ===
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-0">
      <ToastContainer
        position="top-right" // トーストが表示される位置
        autoClose={3000}     // 3秒後に自動的に消える
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark" // 背景色に合わせてダークテーマを指定
      />
      <div className="p-3 border-b border-zinc-800 overflow">
        <div className="text-xs text-zinc-400 text-center"
        >
           モード: {mode === "remote" ? "Firebase" : "ローカル(localStorage)"}
          <span className="ml-2"
          >
             / ユーザー: {user ? user.displayName ?? user.email ?? "ログイン中" : "未ログイン"}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm mt-2 mb-4">
          <label htmlFor="season-select" className="font-semibold"
          >
             シーズン選択:
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value as Season)}
            className="p-2 border border-zinc-700 bg-zinc-800 rounded text-white"
          >
            {SEASON_COLLECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
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

        {/* 入力フォーム部分 */}
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
            <p className="text-sm text-zinc-400">勝敗登録（即時反映）</p>
            <div className="flex gap-2">
              <button
                onClick={() => addMatch("L")} // Lの勝利として即登録
                className={"py-2 px-4 rounded-lg transition-colors bg-green-600 hover:bg-blue-700"}
                disabled={!left.every(p => p !== null) || !right.every(p => p !== null)}
              >
                 先攻の勝利
              </button>
              <button
                onClick={() => addMatch("R")} // Rの勝利として即登録
                className={"py-2 px-4 rounded-lg transition-colors bg-green-600 hover:bg-blue-700"}
                disabled={!left.every(p => p !== null) || !right.every(p => p !== null)}
              >
                 後攻の勝利
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-3">
              {mode === "local" && (
                <button
                  onClick={syncLocal}
                  className={`px-3 py-2 rounded text-sm text-white bg-blue-600 hover:bg-blue-700`}
                >
                   ローカルデータの読み込み
                </button>
              )}
            </div>
          </div>
        </div>

        <RatioTable />
      </div>

      <div className="p-3 md:p-6 overflow-x-auto">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Stat
            t="通常戦 勝率"
            m={ns}
            color="bg-orange-950/40"
            minPair={MIN_GAMES_FOR_PAIR_STATS}
            minTrio={MIN_GAMES_FOR_TRIO_STATS}
          />
          <Stat
            t="レシオ制 勝率"
            m={rs}
            color="bg-blue-950/40"
            minPair={MIN_GAMES_FOR_PAIR_STATS}
            minTrio={MIN_GAMES_FOR_TRIO_STATS}
          />
          <Stat
            t="全試合 勝率"
            m={as}
            color="bg-green-950/40"
            minPair={MIN_GAMES_FOR_PAIR_STATS}
            minTrio={MIN_GAMES_FOR_TRIO_STATS}
          />
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
            登録試合一覧({sortedMatches.length})
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
              {sortedMatches.map((m, i) => (
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
        {/* CSVエクスポートボタンを配置 */}
        <div className="flex justify-center mt-6 mb-6">
            <button
                onClick={exportToCsv}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
            >
                CSVエクスポート (Download)
            </button>
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
