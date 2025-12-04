import { useCallback } from "react";
import { toast } from "react-toastify";
import type { Match, SeasonKey } from "../types";

export const useCsvExport = (matches: Match[], selectedSeason: SeasonKey) => {
  const exportToCsv = useCallback(() => {
    if (matches.length === 0) {
      toast.info("エクスポートするデータがありません");
      return;
    }

    const headers = [
      "# 先攻プロトコル1",
      "先攻プロトコル2",
      "先攻プロトコル3",
      "後攻プロトコル1",
      "後攻プロトコル2",
      "後攻プロトコル3",
      "勝者(S/F)",
      "対戦日",
      "レシオ判定(T/F)",
      "登録日時",
    ];

    const csvRows = matches.map((m) => {
      // ★ 日付フォーマット処理
      // null の場合は空文字、値があればロケール形式 (YYYY/MM/DD等) に
      const matchDateStr = m.matchDate
        ? new Date(m.matchDate).toLocaleDateString("ja-JP")
        : "";
      // ★ 登録日時は詳細なISO形式か、読みやすい形式か選べますが、
      // ここでは可読性とExcelでの扱いやすさを考慮してローカル日時にします
      const createdAtStr = new Date(m.createdAt).toLocaleString("ja-JP");

      return [
        ...m.first,
        ...m.second,
        m.winner,
        matchDateStr,
        m.ratio ? "TRUE" : "FALSE",
        createdAtStr,
      ]
        .map((field) => `"${field}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    // UTF-8 BOM付きで保存 (Excelでの文字化け防止)
    const blob = new Blob(["\ufeff", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // ダウンロード処理
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
