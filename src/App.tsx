import { Analytics } from "@vercel/analytics/react"
import { useMemo, useState, useCallback } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Config & Types
import {
  SEASONS_CONFIG,
  PROTOCOL_SETS,
  RATIO_SETS,
  MIN_GAMES_FOR_PAIR_STATS,
  MIN_GAMES_FOR_TRIO_STATS
} from "./config";
import type {
  Protocol,
  Trio,
  Match,
  SeasonKey,
  Winner
} from "./types";

// Hooks & Logic
import { useAuth } from "./hooks/useAuth";
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
  const { user } = useAuth();

  // === シーズン選択 ===
  // Object.keys の戻り値を SeasonKey[] にキャスト
  const SEASON_KEYS = Object.keys(SEASONS_CONFIG) as SeasonKey[];

  const [seasonKey, setSeasonKey] = useState<SeasonKey>(() =>
    (localStorage.getItem('selectedSeason') as SeasonKey) || SEASON_KEYS[0]
  );

  // ★ 設定オブジェクトから現在の設定を取得
  const currentConfig = SEASONS_CONFIG[seasonKey];
  const currentProtocols = PROTOCOL_SETS[currentConfig.protocolVer] as readonly Protocol[];
  const currentRatios = RATIO_SETS[currentConfig.ratioVer];
  const isRegistrationAllowed = !currentConfig.isReadOnly;
  const maxRatio = currentConfig.maxRatio;

  // --- Data Hook ---
  // Firestoreのコレクション名は config から取得
  const {
    items: matches,
    add: addMatchItem,
    remove: removeMatch,
    addBatch: addMatchItemBatch,
    mode,
    reloadLocal
  } = useFirestore<Match>(currentConfig.collectionName);

  // --- Derived Stats (Expensive Calcs) ---
  const { stats, matrices } = useMatchStats(matches);
  const { exportToCsv } = useCsvExport(matches, seasonKey);
  // 要修正
  const { handleImportCsv } = useCsvImport(addMatchItemBatch, currentProtocols, currentRatios, maxRatio);

  // --- Callbacks ---
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = e.target.value as SeasonKey;
    setSeasonKey(s);
    localStorage.setItem('selectedSeason', s);
  };

  const handleAddMatch = useCallback((data: {
    first: Trio,
    second: Trio,
    winner: Winner,
    matchDate: number | null }) => {
    if (!isRegistrationAllowed) return;

    void addMatchItem({
      ...data,
      // ★ logic関数に現在の設定(ratios, maxRatio)を渡す
      ratio: isRatioBattle(data.first, data.second, currentRatios, maxRatio),
      userId: user?.uid,
      matchDate: data.matchDate
    });
  }, [addMatchItem, isRegistrationAllowed, currentRatios, maxRatio, user]);

  // ★ MatchForm に渡すためのヘルパー (カリー化)
  // MatchForm自体は Ratios オブジェクト全体を知らなくても、計算できれば良いため
  const ratioSumHelper = useCallback((t: Trio) => {
    return t.reduce((a, p) => a + (currentRatios[p] ?? 0), 0);
  }, [currentRatios]); // currentRatios が変われば再生成される


  const handleRemoveMatch = useCallback((id: string) => {
    if (!isRegistrationAllowed) return;
    void removeMatch(id);
  }, [removeMatch, isRegistrationAllowed]);


  // ★ FIX: reloadLocalをシンプルにラップ
  // useFirestore側で通知を出すため、App.tsx側ではロジックを持たせない
  const handleSyncLocal = useCallback(() => {
    reloadLocal();
  }, [reloadLocal]);


  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      // 1. matchDateが存在する場合、matchDateでソート (新しい日付が前)
      const matchDateA = a.matchDate ?? 0;
      const matchDateB = b.matchDate ?? 0;
      if (matchDateA !== matchDateB) {
        return matchDateB - matchDateA;
      }

      // 2. matchDateが同じか、存在しない場合、createdAtでソート (新しい登録が前)
      return b.createdAt - a.createdAt;
    });
  }, [matches]);


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-0 font-sans">
      <ToastContainer position="top-center" theme="dark" autoClose={2000} />

      {/* Header Area */}
      {/* ★ Header コンポーネントを呼び出し、必要な Props のみ渡す */}
      <Header
        season={seasonKey}
        seasonCollections={SEASON_KEYS}
        handleSeasonChange={handleSeasonChange}
        mode={mode}
      />

      <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-8">
        {/* Input Section */}
        <section>
          <MatchForm
            protocols={currentProtocols}
            onAddMatch={handleAddMatch}
            isRegistrationAllowed={isRegistrationAllowed}
            onSyncLocal={handleSyncLocal}
            mode={mode}
            ratioSum={ratioSumHelper}
          />
          <RatioTable
            protocols={currentProtocols}
            ratios={currentRatios}
          />
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
          {isRegistrationAllowed && (
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
              <p className="text-xs text-zinc-300 mt-2">（F1, F2, F3, S1, S2, S3, Winner, matchDateの順）</p>
            </div>
          )}
        </section>
        <Footer />
        <Analytics />
      </div>
    </div>
  );
}
