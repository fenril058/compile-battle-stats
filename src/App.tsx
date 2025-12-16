import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazy, Suspense, useCallback, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import { DataToolbar } from "./components/DataToolbar";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { MatchForm } from "./components/MatchForm";

// 重いコンポーネントを遅延読み込みにする
const StatsDashboard = lazy(() =>
  import("./components/StatsDashboard").then((module) => ({
    default: module.StatsDashboard,
  })),
);
const MatchList = lazy(() =>
  import("./components/MatchList").then((module) => ({
    default: module.MatchList,
  })),
);
const RatioTable = lazy(() =>
  import("./components/RatioTable").then((module) => ({
    default: module.RatioTable,
  })),
);

// Config & Types
import {
  MIN_GAMES_FOR_PAIR_STATS,
  MIN_GAMES_FOR_TRIO_STATS,
  PROTOCOL_SETS,
  RATIO_SETS,
  SEASONS_CONFIG,
} from "./config";
// Hooks & Logic
import { useCsvExport } from "./hooks/useCsvExport";
import { useCsvImport } from "./hooks/useCsvImport";
import { useFirestore } from "./hooks/useFirestore";
import { useMatchStats } from "./hooks/useMatchStats";
import type { Match, Protocol, SeasonKey, Trio, Winner } from "./types";
import { isRatioBattle } from "./utils/logic";

// Loading用のシンプルなコンポーネント
const LoadingSkeleton = () => (
  <div className="h-600 w-full animate-pulse bg-zinc-900 rounded-xl flex items-center justify-center">
    <span className="text-zinc-500">Loading stats...</span>
  </div>
);

export default function App() {
  // === シーズン選択 ===
  // Object.keys の戻り値を SeasonKey[] にキャスト
  const SEASON_KEYS = Object.keys(SEASONS_CONFIG) as SeasonKey[];

  const [seasonKey, setSeasonKey] = useState<SeasonKey>(
    () =>
      (localStorage.getItem("selectedSeason") as SeasonKey) || SEASON_KEYS[0],
  );

  // ★ 設定オブジェクトから現在の設定を取得
  const currentConfig = SEASONS_CONFIG[seasonKey];
  const currentProtocols = PROTOCOL_SETS[
    currentConfig.protocolVer
  ] as readonly Protocol[];
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
    reloadLocal,
  } = useFirestore<Match>(currentConfig.collectionName);

  // --- Derived Stats (Expensive Calcs) ---
  const { stats, matrices, sortedMatches } = useMatchStats(matches);
  const { exportToCsv } = useCsvExport(matches, seasonKey);
  const { handleImportCsv } = useCsvImport(
    addMatchItemBatch,
    currentProtocols,
    currentRatios,
    maxRatio,
  );

  // --- Callbacks ---
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = e.target.value as SeasonKey;
    setSeasonKey(s);
    localStorage.setItem("selectedSeason", s);
  };

  const handleAddMatch = useCallback(
    (data: {
      first: Trio;
      second: Trio;
      winner: Winner;
      matchDate: number | null;
      userId: string;
    }) => {
      if (!isRegistrationAllowed) return;

      void addMatchItem({
        ...data,
        // ★ logic関数に現在の設定(ratios, maxRatio)を渡す
        ratio: isRatioBattle(data.first, data.second, currentRatios, maxRatio),
        matchDate: data.matchDate,
      });
    },
    [addMatchItem, isRegistrationAllowed, currentRatios, maxRatio],
  );

  // ★ MatchForm に渡すためのヘルパー (カリー化)
  // MatchForm自体は Ratios オブジェクト全体を知らなくても、計算できれば良いため
  const ratioSumHelper = useCallback(
    (t: Trio) => {
      return t.reduce((a, p) => a + (currentRatios[p] ?? 0), 0);
    },
    [currentRatios],
  ); // currentRatios が変われば再生成される

  const handleRemoveMatch = useCallback(
    (id: string) => {
      if (!isRegistrationAllowed) return;
      void removeMatch(id);
    },
    [removeMatch, isRegistrationAllowed],
  );

  // reloadLocalをシンプルにラップ
  // useFirestore側で通知を出すため、App.tsx側ではロジックを持たせない
  const handleSyncLocal = useCallback(() => {
    reloadLocal();
  }, [reloadLocal]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-0 font-sans">
      <ToastContainer position="top-center" theme="dark" autoClose={2000} />
      <main>
        <Suspense fallback={<LoadingSkeleton />}>
          <Header
            season={seasonKey}
            seasonCollections={SEASON_KEYS}
            handleSeasonChange={handleSeasonChange}
            mode={mode}
          />
        </Suspense>

        <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-8">
          {/* Input Section */}
          <section>
            <Suspense fallback={<LoadingSkeleton />}>
              <MatchForm
                protocols={currentProtocols}
                onAddMatch={handleAddMatch}
                isRegistrationAllowed={isRegistrationAllowed}
                onSyncLocal={handleSyncLocal}
                mode={mode}
                ratioSum={ratioSumHelper}
              />
            </Suspense>
            {/* レシオ表は常に表示 */}
            <RatioTable protocols={currentProtocols} ratios={currentRatios} />
          </section>

          {/* Visualization Section */}
          <Suspense fallback={<LoadingSkeleton />}>
            <StatsDashboard
              stats={stats}
              matrices={matrices}
              protocols={currentProtocols}
              minPair={MIN_GAMES_FOR_PAIR_STATS}
              minTrio={MIN_GAMES_FOR_TRIO_STATS}
            />
          </Suspense>

          {/* Data Management Section */}
          <section>
            <Suspense fallback={<LoadingSkeleton />}>
              <MatchList
                matches={sortedMatches}
                onRemove={handleRemoveMatch}
                isRegistrationAllowed={isRegistrationAllowed}
              />
              {/* CSV export and import */}
              <DataToolbar
                onExport={exportToCsv}
                onImport={handleImportCsv}
                isRegistrationAllowed={isRegistrationAllowed}
              />
            </Suspense>
          </section>

          <Footer />
        </div>
      </main>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
