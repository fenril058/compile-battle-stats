// src/App.tsx
import { useMemo, useState, useCallback } from "react";
import { ToastContainer } from 'react-toastify';
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
  SeasonCollectionName
} from "./types";

// ★ FIX: Firebase/Auth関連のインポートをすべて削除
// Hooks & Logic
import { useFirestore } from "./hooks/useFirestore";
import { isRatioBattle } from "./utils/logic";
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
// ★ NEW: Header コンポーネントをインポート
import { Header } from "./components/Header";


export default function App() {
  // ★ 削除: 認証関連のステート、useEffect、認証関数はすべて useAuth に移動

  // === シーズン選択 ===
  const SEASON_COLLECTIONS = Object.keys(SEASON_COLLECTIONS_CONFIG) as SeasonCollectionName[];
  const [season, setSeason] = useState<SeasonCollectionName>(() =>
    (localStorage.getItem('selectedSeason') as SeasonCollectionName) || SEASON_COLLECTIONS[0]
  );

  // 登録可否フラグ（useMemoは不要）
  const currentProtocols = PROTOCOL_SETS[SEASON_COLLECTIONS_CONFIG[season]] as Protocol[];
  const isRegistrationAllowed = !UNAVAILABLE_SEASONS.includes(season);

  // --- Data Hook ---
  const {
    items: matches,
    add: addMatchItem,
    remove: removeMatch,
    addBatch: addMatchItemBatch,
    mode,
    reloadLocal // ローカル再読込関数
  } = useFirestore<Match>(season);

  // --- Derived Stats (Expensive Calcs) ---
  const { stats, matrices } = useMatchStats(matches);
  const { exportToCsv } = useCsvExport(matches, season);
  const { handleImportCsv } = useCsvImport(addMatchItemBatch, currentProtocols);

  // --- Callbacks ---
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = e.target.value as SeasonCollectionName;
    setSeason(s);
    localStorage.setItem('selectedSeason', s);
  };

  const handleAddMatch = useCallback((data: { first: Trio, second: Trio, winner: 'FIRST' | 'SECOND' }) => {
    if (!isRegistrationAllowed) { /* toastはMatchForm側で出す */ return; }

    void addMatchItem({
      ...data,
      ratio: isRatioBattle(data.first, data.second),
    });
  }, [addMatchItem, isRegistrationAllowed]);


  const handleRemoveMatch = useCallback((id: string) => {
    if (!isRegistrationAllowed) return;
    void removeMatch(id);
  }, [removeMatch, isRegistrationAllowed]);

  const ratioSumHelper = useCallback((t: Trio) => t.reduce((a, p) => a + (RATIOS[p] ?? 0), 0), []);

  // ★ FIX: reloadLocalをシンプルにラップ
  // useFirestore側で通知を出すため、App.tsx側ではロジックを持たせない
  const handleSyncLocal = useCallback(() => {
    reloadLocal();
  }, [reloadLocal]);


  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => b.timestamp - a.timestamp);
  }, [matches]);


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-0 font-sans">
      <ToastContainer position="top-center" theme="dark" autoClose={2000} />

      {/* Header Area */}
      {/* ★ Header コンポーネントを呼び出し、必要な Props のみ渡す */}
      <Header
        season={season}
        seasonCollections={SEASON_COLLECTIONS}
        handleSeasonChange={handleSeasonChange}
        mode={mode}
      />

      <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-8">
        {/* Input Section */}
        <section>
          <h2 className="text-base font-semibold mt-4 mb-2 text-center">試合登録</h2>
          <MatchForm
            protocols={currentProtocols}
            onAddMatch={handleAddMatch}
            isRegistrationAllowed={isRegistrationAllowed}
            onSyncLocal={handleSyncLocal}
            mode={mode}
            ratioSum={ratioSumHelper}
          />
          <RatioTable protocols={currentProtocols} />
        </section>

        {/* Visualization Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat t="通常戦" m={stats.normal} color="bg-orange-950/20" minPair={MIN_GAMES_FOR_PAIR_STATS} minTrio={MIN_GAMES_FOR_TRIO_STATS} />
            <Stat t="レシオ" m={stats.ratio} color="bg-blue-950/20" minPair={MIN_GAMES_FOR_PAIR_STATS} minTrio={MIN_GAMES_FOR_TRIO_STATS} />
            <Stat t="全体" m={stats.all} color="bg-green-950/20" minPair={MIN_GAMES_FOR_PAIR_STATS} minTrio={MIN_GAMES_FOR_TRIO_STATS} />
        </section>

        <section className="overflow-x-auto">
           <div className="flex flex-col gap-6">
              <Matrix t="通常戦 相性表" m={matrices.normal} bg="bg-zinc-900/50" protocols={currentProtocols} />
           </div>
        </section>

        <section className="overflow-x-auto">
           <div className="flex flex-col gap-6">
              <Matrix t="レシオ 相性表" m={matrices.ratio} bg="bg-zinc-900/50" protocols={currentProtocols} />
           </div>
        </section>

        <section className="overflow-x-auto">
           <div className="flex flex-col gap-6">
              <Matrix t="全試合 相性表" m={matrices.all} bg="bg-zinc-900/50" protocols={currentProtocols} />
           </div>
        </section>

        {/* Data Management Section */}
        <section>
          <MatchList matches={sortedMatches}
            onRemove={handleRemoveMatch}
            isRegistrationAllowed={isRegistrationAllowed} />

          <div className="flex justify-center mt-6 mb-6">
            <button onClick={exportToCsv}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xm"
            >CSV Export</button>
          </div>

          <div className="flex flex-col items-center justify-center mt-6 mb-6 p-4
          border border-zinc-700 rounded-lg">
            <label htmlFor="csv-upload" className="font-semibold mb-2 text-zinc-300"
            >
               CSVから試合データをインポート
            </label>
            {/* ★ FIX: CSV Importボタンとinputタグの構造を変更し、ボタンにファイル選択を委譲する */}
            <div className="relative overflow-hidden inline-block">
              {/* ユーザーに見せるボタン */}
              <button
                className="btn-secondary px-4 py-2 bg-zinc-700 text-white rounded-lg text-xm"
              >ファイルを選択</button>
              {/* 実際に入力を受け付けるinput (非表示) */}
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                onChange={handleImportCsv}
                // input要素を絶対配置でボタンの上に重ね、透過させる
                className="absolute left-0 top-0 opacity-0 cursor-pointer h-full w-full"
              />
            </div>
            <p className="text-xs text-zinc-300 mt-2">（F1, F2, F3, S1, S2, S3, Winner の順で7列必須）</p>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}
