import { useEffect, useMemo, useState, useCallback } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Config & Types
import {
  RATIOS,
  SEASON_COLLECTIONS_CONFIG,
  PROTOCOL_SETS,
  UNAVAILABLE_SEASONS,
  MIN_GAMES_FOR_PAIR_STATS,
  MIN_GAMES_FOR_TRIO_STATS
} from "./config";
import type {
  Protocol,
  Trio,
  Match,
  SeasonCollectionName,
  Winner
} from "./types";

// Firebase
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

// Hooks & Logic
import { useFirestore } from "./hooks/useFirestore";
import { isRatioBattle } from "./utils/logic"; // 判定ロジックは単純なのでここで使用
import { useMatchStats } from "./hooks/useMatchStats";
import { useCsvExport } from "./hooks/useCsvExport";
import { useCsvImport } from "./hooks/useCsvImport";

// Components
import { Stat } from "./components/Stat";
import { Matrix } from "./components/Matrix";
import { MatchForm } from "./components/MatchForm";
import { MatchList } from "./components/MatchList";
import { Footer } from "./components/Footer";
import { RatioTable } from "./components/RatioTable";

export default function App() {
  // === シーズン選択 ===
  const SEASON_COLLECTIONS = Object.keys(SEASON_COLLECTIONS_CONFIG) as SeasonCollectionName[];

  const [selectedSeason, setSelectedSeason] = useState<SeasonCollectionName>(() => {
    const saved = localStorage.getItem('selectedSeason');
    if (saved && SEASON_COLLECTIONS.includes(saved as SeasonCollectionName)) {
      return saved as SeasonCollectionName;
    }
    return SEASON_COLLECTIONS[0];
  });

  useEffect(() => {
    localStorage.setItem('selectedSeason', selectedSeason);
  }, [selectedSeason]);

  const currentProtocolSetKey = SEASON_COLLECTIONS_CONFIG[selectedSeason];
  const currentProtocols = PROTOCOL_SETS[currentProtocolSetKey] as unknown as Protocol[];

  const ratioSum = useMemo(() => {
    return (t: Trio): number => t.reduce((a, p) => a + (RATIOS[p] ?? 0), 0);
  }, []);

  const isRegistrationAllowed = useMemo(() => {
    return !UNAVAILABLE_SEASONS.includes(selectedSeason);
  }, [selectedSeason]);

  const isLocked = !isRegistrationAllowed;

  // === データ管理 & 統計計算Hooks ===
  const {
    mode,
    items: matches,
    add: addMatch,
    addBatch: addMatchBatch,
    remove: removeMatch,
    reloadLocal,
  } = useFirestore<Match>(selectedSeason);

  // 統計計算ロジック（Hooksへ委譲）
  const { stats, matrices } = useMatchStats(matches);

  // CSV出力ロジック（Hooksへ委譲）
  const { exportToCsv } = useCsvExport(matches, selectedSeason);

  // CSV入力ロジック（Hooksへ委譲）
  const { handleImportCsv } = useCsvImport(
    addMatchBatch,
    currentProtocols
  );

  // 表示用ソート済みリスト
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return a.id.localeCompare(b.id);
    });
  }, [matches]);

  // === 認証 ===
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const login = async () => {
    if (!auth) {
      toast.warn("Firebase Config Error");
      return;
    }
    await signInWithPopup(auth, new GoogleAuthProvider());
  };
  const logout = async () => {
    if (auth) await signOut(auth);
  };

  // === UI入力状態 ===
  const [first, setFirst] = useState<Trio>(["DARKNESS", "FIRE", "HATE"]);
  const [second, setSecond] = useState<Trio>(["PSYCHIC", "GRAVITY", "WATER"]);

  // === アクション ===
  const handleAddMatch = useCallback((data: { first: Trio, second: Trio, winner: Winner }) => {
    if (isLocked) { toast.error("Locked season"); return; }
    void addMatch({
      ...data,
      ratio: isRatioBattle(data.first, data.second),
    });
  }, [addMatch, isLocked]);

  const handleRemoveMatch = useCallback((id: string) => {
    if (isLocked) return;
    void removeMatch(id);
  }, [removeMatch, isLocked]);

  // const addMatch = (winner: "FIRST" | "SECOND") => {
  //   if (!isRegistrationAllowed) {
  //     toast.error(`「${selectedSeason}」は登録期間が終了しています。`);
  //     return;
  //   }
  //   if (first.some(p => p === null) || second.some(p => p === null)) {
  //     toast.error("プロトコルをすべて選択してください");
  //     return;
  //   }
  //   const payload = {
  //     first,
  //     second,
  //     winner,
  //     ratio: isRatioBattle(first, second),
  //   };
  //   void addMatchItem(payload);
  // };

  // const removeMatch = (id: string) => {
  //   if (!isRegistrationAllowed) {
  //     toast.error(`データは確定済みのため削除できません。`);
  //     return;
  //   }
  //   void removeMatchItem(id);
  // };

  const syncLocal = () => {
    try {
      reloadLocal();
      toast.success("ローカルデータを再読込しました");
    } catch {
      toast.error("読込失敗");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-0">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
      />

      <div className="p-3 border-b border-zinc-800">
        {mode === "local" && (
          <div className="text-center text-xs text-red-400 mt-2">
             Local Mode (LocalStorage)
          </div>
        )}

        {/* ヘッダーエリア */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <h1 className="text-xl font-bold whitespace-nowrap">
               Compile Battle Stats
            </h1>
            <div className="flex items-center space-x-2 text-sm">
              <label htmlFor="season-select" className="font-semibold text-zinc-400 whitespace-nowrap">
                 Season:
              </label>
              <select
                id="season-select"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value as SeasonCollectionName)}
                className="p-1 border border-zinc-700 bg-zinc-800 rounded text-white text-sm"
              >
                {SEASON_COLLECTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap justify-between sm:justify-end sm:items-center gap-2 text-xs sm:text-sm mt-2 sm:mt-0">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 whitespace-nowrap">
                  {user.displayName ?? "User"}
                </span>
                <button onClick={logout} className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded">
                   ログアウト
                </button>
              </div>
            ) : (
              <button onClick={login} className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded">
                 Googleログイン
              </button>
            )}
          </div>
        </div>

        <h2 className="text-base font-semibold mt-4 mb-2 text-center">試合登録</h2>

        {/* 登録フォームコンポーネント */}
        <MatchForm
          protocols={currentProtocols}
          first={first}
          second={second}
          setFirst={setFirst}
          setSecond={setSecond}
          onAddMatch={handleAddMatch}
          isRegistrationAllowed={isRegistrationAllowed}
          onSyncLocal={syncLocal}
          ratioSum={ratioSum}
          mode={mode}
        />
      </div>

      {/* RatioTableは情報参照のため常に表示 */}
      <RatioTable protocols={currentProtocols} />

      <div className="p-3 md:p-6 overflow-x-auto">
        {/* 統計エリア */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Stat
            t="通常戦 勝率"
            m={stats.normal}
            color="bg-orange-950/40"
            minPair={MIN_GAMES_FOR_PAIR_STATS}
            minTrio={MIN_GAMES_FOR_TRIO_STATS}
          />
          <Stat
            t="レシオ制 勝率"
            m={stats.ratio}
            color="bg-blue-950/40"
            minPair={MIN_GAMES_FOR_PAIR_STATS}
            minTrio={MIN_GAMES_FOR_TRIO_STATS}
          />
          <Stat
            t="全試合 勝率"
            m={stats.all}
            color="bg-green-950/40"
            minPair={MIN_GAMES_FOR_PAIR_STATS}
            minTrio={MIN_GAMES_FOR_TRIO_STATS}
          />
        </div>

        {/* 相性表エリア */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Matrix
            t="通常戦 相性表"
            m={matrices.normal}
            bg="bg-orange-950/10"
            protocols={currentProtocols}
          />
          <Matrix
            t="レシオ制 相性表"
            m={matrices.ratio}
            bg="bg-blue-950/10"
            protocols={currentProtocols}
          />
          <Matrix
            t="全試合 相性表"
            m={matrices.all}
            bg="bg-green-950/10"
            protocols={currentProtocols}
          />
        </div>

        {/* 試合一覧コンポーネント */}
        <MatchList
          matches={sortedMatches}
          onRemove={handleRemoveMatch}
          isRegistrationAllowed={isRegistrationAllowed}
        />

        <div className="flex justify-center mt-6 mb-6">
          <button
            onClick={exportToCsv}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
          >
             CSVエクスポート
          </button>
        </div>

        {/* ★ 追加: CSVインポート用フォーム ★ */}
        <div className="flex flex-col items-center justify-center mt-6 mb-6 p-4
        border border-zinc-700 rounded-lg">
          <label htmlFor="csv-upload" className="font-semibold mb-2 text-zinc-300"
          >
             CSVから試合データをインポート
          </label>
          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={handleImportCsv}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full
            file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
          />
          <p className="text-xs text-zinc-500 mt-2">（F1, F2, F3, S1, S2, S3, Winner の順で7列必須）</p>
        </div>

        <Footer />
      </div>
    </div>
  );
}
