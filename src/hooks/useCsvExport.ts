import { useCallback } from "react";
import { toast } from 'react-toastify';
import type { Match, SeasonCollectionName } from "../types";

export const useCsvExport = (
  matches: Match[],
  selectedSeason: SeasonCollectionName
) => {
  const exportToCsv = useCallback(() => {
    if (matches.length === 0) {
      toast.info("エクスポートするデータがありません");
      return;
    }

    const headers = [
      // "ID",
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

    const csvRows = matches.map((m) =>
      [
        // m.id,
        ...m.first,
        ...m.second,
        m.winner,
        m.ratio ? "TRUE" : "FALSE",
        m.timestamp,
      ]
        .map((field) => `"${field}"`)
        .join(",")
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\ufeff", csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `compile_battle_stats_${selectedSeason}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success("CSVファイルをエクスポートしました");
  }, [matches, selectedSeason]);

  return { exportToCsv };
};
