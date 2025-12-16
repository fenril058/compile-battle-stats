import type React from "react";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { SEASONS_CONFIG } from "../config";
import { MatchDataContext } from "../contexts/MatchDataCtx"; // ★ Contextをインポート
// ★ 重たいフックとコンポーネントをここに集約
import { useAuth } from "../hooks/useAuth"; // ユーザーID取得用
import { useCsvExport } from "../hooks/useCsvExport";
import { useCsvImport } from "../hooks/useCsvImport";
import { useFirestore } from "../hooks/useFirestore";
import { useMatchStats } from "../hooks/useMatchStats";
import type { Protocol, SeasonKey } from "../types";
import { DataToolbar } from "./DataToolbar";
import { MatchList } from "./MatchList";
import { StatsDashboard } from "./StatsDashboard";

// App.tsx から必要なデータを受け取る
type DataDashboardProps = {
  seasonKey: SeasonKey;
  currentProtocols: readonly Protocol[];
  isRegistrationAllowed: boolean;
};

export const DataDashboard: React.FC<DataDashboardProps> = ({
  seasonKey,
  currentProtocols,
  isRegistrationAllowed,
}) => {
  // --- ここで初めてFirebase関連のコードがロードされる ---
  const { user } = useAuth(); // ログイン情報
  const currentConfig = SEASONS_CONFIG[seasonKey];

  // Firestoreデータ取得
  const {
    items: matches,
    add: addMatchItem,
    remove: removeMatch,
    addBatch: addMatchItemBatch,
    reloadLocal,
  } = useFirestore(currentConfig.collectionName);

  // 統計集計
  const { stats, matrices, sortedMatches } = useMatchStats(matches);

  // CSV関連
  const { exportToCsv } = useCsvExport(matches, seasonKey);
  const { handleImportCsv } = useCsvImport(
    addMatchItemBatch,
    currentProtocols,
    currentConfig.maxRatio,
  );

  // onAddMatch / onSyncLocal の実装
  const handleAddMatch = useCallback(
    (data: {
      first: Trio;
      second: Trio;
      winner: Winner;
      matchDate: number | null;
    }) => {
      // 登録可能期間中でも、DataDashboardがロードされるまでは何もしない（トーストなどで通知しても良い）
      console.log("Match added locally or waiting for data module to load.");
    },
    [],
  );

  const handleSyncLocal = useCallback(() => reloadLocal(), [reloadLocal]);

  // ★ Contextに提供する値
  const contextValue = React.useMemo(
    () => ({
      onAddMatch: handleAddMatch,
      onSyncLocal: handleSyncLocal,
      isDataReady: true, // データがロードされたので true
    }),
    [handleAddMatch, handleSyncLocal],
  );

  // ロード完了時にユーザーに通知
  React.useEffect(() => {
    toast.success("データ処理モジュールのロードが完了しました！");
  }, []);

  return (
    <>
      {/* 統計グラフエリア */}
      <StatsDashboard
        stats={stats}
        matrices={matrices}
        protocols={currentProtocols}
        // ... 他のprops
      />

      {/* データ管理エリア */}
      <section>
        <MatchList
          matches={sortedMatches}
          onRemove={(id) => removeMatch(id)}
          isRegistrationAllowed={isRegistrationAllowed}
        />
        <DataToolbar
          onExport={exportToCsv}
          onImport={handleImportCsv}
          isRegistrationAllowed={isRegistrationAllowed}
        />
      </section>
    </>
  );
};
