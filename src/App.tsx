import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import { DataToolbar } from "./components/DataToolbar";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { MatchForm } from "./components/MatchForm";
import { RatioTable } from "./components/RatioTable";
import { SectionNav } from "./components/SectionNav";
import { StatsDashboard } from "./components/StatsDashboard";

const MatchList = lazy(() =>
  import("./components/MatchList").then((module) => ({
    default: module.MatchList,
  })),
);

// Config & Types
import {
  MIN_GAMES_FOR_PAIR_STATS,
  MIN_GAMES_FOR_TRIO_STATS,
  PROTOCOL_GROUPS,
  PROTOCOL_SETS,
  RATIO_SETS,
  SEASONS_CONFIG,
} from "./config";
// Hooks & Logic
import { useAuth } from "./hooks/useAuth";
import { useCsvExport } from "./hooks/useCsvExport";
import { useCsvImport } from "./hooks/useCsvImport";
import { useFirestore } from "./hooks/useFirestore";
import { useMatchStats } from "./hooks/useMatchStats";
import { useT } from "./i18n";
import { isRatioBattle } from "./lib/logic";
import { resolveSeasonKey } from "./lib/seasonKey";
import type { Match, Protocol, Ratios, SeasonKey, Trio, Winner } from "./types";

export default function App() {
  const { t } = useT();
  // CSV 一括登録に所有者 uid を渡すため（Firestore ルールが create で要求する）。
  const { user, isAuthEnabled } = useAuth();
  // === シーズン選択 ===
  // Object.keys の戻り値を SeasonKey[] にキャスト
  const SEASON_KEYS = Object.keys(SEASONS_CONFIG) as SeasonKey[];

  const [seasonKey, setSeasonKey] = useState<SeasonKey>(() =>
    resolveSeasonKey(localStorage.getItem("selectedSeason"), SEASON_KEYS),
  );

  // 解決済みのシーズンキーを localStorage に同期する。
  // 不正/削除済みのキーがフォールバックされた場合に、永続値を実態へ揃える。
  useEffect(() => {
    localStorage.setItem("selectedSeason", seasonKey);
  }, [seasonKey]);

  // ★ 設定オブジェクトから現在の設定を取得
  const currentConfig = SEASONS_CONFIG[seasonKey];
  const currentProtocols = PROTOCOL_SETS[
    currentConfig.protocolVer
  ] as readonly Protocol[];
  const currentProtocolGroups = PROTOCOL_GROUPS[currentConfig.protocolVer];
  // Protocol が V2 まで広がったため、シーズン別 RATIO_SETS を Ratios(Partial) として受ける（#73）。
  const currentRatios: Ratios = RATIO_SETS[currentConfig.ratioVer];
  const isRegistrationAllowed = !currentConfig.isReadOnly;
  const maxRatio = currentConfig.maxRatio;

  // MatchList Loading用のシンプルなコンポーネント
  const MatchListSkeleton = () => (
    <div className="h-[600px] w-full animate-pulse bg-zinc-900 rounded-xl flex items-center justify-center">
      <span className="text-zinc-400">Loading stats...</span>
    </div>
  );

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
  const {
    statViews,
    matrixViews,
    sortedMatches,
    strengthModel,
    strengthModelNormal,
    strengthModelRatio,
    synergy,
    usage,
    archetypes,
    thetaBootstrap,
    trioRecommendations,
  } = useMatchStats(
    matches,
    currentProtocols,
    currentConfig.ratioProtocols as readonly Protocol[],
    currentRatios,
    maxRatio,
  );
  const { exportToCsv } = useCsvExport(
    matches,
    seasonKey,
    currentRatios,
    maxRatio,
    currentConfig.ratioProtocols,
  );
  const {
    handleImportCsv,
    preview: importPreview,
    confirmImport,
    cancelImport,
  } = useCsvImport(
    addMatchItemBatch,
    currentProtocols,
    currentRatios,
    maxRatio,
    currentConfig.ratioProtocols,
    user?.uid,
    isAuthEnabled && !user,
  );

  // --- Callbacks ---
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = e.target.value as SeasonKey;
    setSeasonKey(s);
    // 永続化は seasonKey の useEffect が担当する。
  };

  const handleAddMatch = useCallback(
    (data: {
      first: Trio;
      second: Trio;
      winner: Winner;
      matchDate: number | null;
      userId?: string;
    }) => {
      if (!isRegistrationAllowed) return;

      void addMatchItem({
        ...data,
        ratio: isRatioBattle(
          data.first,
          data.second,
          currentRatios,
          maxRatio,
          currentConfig.ratioProtocols,
        ),
        matchDate: data.matchDate,
      });
    },
    [
      addMatchItem,
      isRegistrationAllowed,
      currentRatios,
      maxRatio,
      currentConfig.ratioProtocols,
    ],
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        {t("app.skipToMain")}
      </a>
      <main id="main-content" tabIndex={-1}>
        <Header
          season={seasonKey}
          seasonCollections={SEASON_KEYS}
          handleSeasonChange={handleSeasonChange}
          mode={mode}
        />
        <SectionNav />

        <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-8">
          {/* Input Section */}
          <section className="min-h-[420px]">
            <MatchForm
              protocolGroups={currentProtocolGroups}
              onAddMatch={handleAddMatch}
              isRegistrationAllowed={isRegistrationAllowed}
              onSyncLocal={handleSyncLocal}
              mode={mode}
              ratioSum={ratioSumHelper}
            />
            {/* レシオ表は常に表示 */}
            <RatioTable protocols={currentProtocols} ratios={currentRatios} />
          </section>

          {/* Visualization Section */}
          <StatsDashboard
            statViews={statViews}
            matrixViews={matrixViews}
            minPair={MIN_GAMES_FOR_PAIR_STATS}
            minTrio={MIN_GAMES_FOR_TRIO_STATS}
            strengthModel={strengthModel}
            strengthModelNormal={strengthModelNormal}
            strengthModelRatio={strengthModelRatio}
            synergy={synergy}
            usage={usage}
            archetypes={archetypes}
            thetaBootstrap={thetaBootstrap}
            trioRecommendations={trioRecommendations}
          />

          {/* Data Management Section */}
          <section className="below-fold">
            <Suspense fallback={<MatchListSkeleton />}>
              <MatchList
                matches={sortedMatches}
                onRemove={handleRemoveMatch}
                isRegistrationAllowed={isRegistrationAllowed}
                mode={mode}
                currentUserId={user?.uid}
              />
            </Suspense>
            {/* CSV export and import */}
            <DataToolbar
              onExport={exportToCsv}
              onImport={handleImportCsv}
              isRegistrationAllowed={isRegistrationAllowed}
              preview={importPreview}
              onConfirmImport={confirmImport}
              onCancelImport={cancelImport}
            />
          </section>
          <Footer />
        </div>
      </main>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
