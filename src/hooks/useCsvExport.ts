import { useCallback } from "react";
import { toast } from "react-toastify";
import { SEASONS_CONFIG } from "../config";
import type { Match, Ratios, SeasonKey } from "../types";
import { formatCalendarDateForCsv } from "../utils/date";

/**
 * エクスポートする CSV の先頭に挿入する、シーズンのレシオ表コメントを生成する。
 * すべての行が '#' で始まるため、インポート時にはコメントとしてスキップされる
 * （useCsvImport 側の '#' スキップと対応）。
 */
export const buildRatioTableComment = (
  selectedSeason: SeasonKey,
  ratios: Ratios,
  maxRatio: number,
  ratioProtocols: ReadonlyArray<string>,
): string[] => {
  const config = SEASONS_CONFIG[selectedSeason];
  const ratioEntries = Object.entries(ratios).map(([p, r]) => `${p}=${r}`);

  return [
    `# Compile Battle Stats — ${config.displayName} (${selectedSeason})`,
    `# Exported: ${new Date().toISOString()}`,
    `# Max Ratio: ${maxRatio}`,
    "# Ratio Table:",
    `#   ${ratioEntries.join(", ")}`,
    `# Ratio-eligible protocols: ${ratioProtocols.join(", ")}`,
  ];
};

export const useCsvExport = (
  matches: Match[],
  selectedSeason: SeasonKey,
  ratios: Ratios,
  maxRatio: number,
  ratioProtocols: ReadonlyArray<string>,
) => {
  const exportToCsv = useCallback(() => {
    if (matches.length === 0) {
      toast.info("エクスポートするデータがありません");
      return;
    }

    // エクスポート時点のレシオ表をコメントとして埋め込む
    const ratioComment = buildRatioTableComment(
      selectedSeason,
      ratios,
      maxRatio,
      ratioProtocols,
    );

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
      // 対戦日は暦日なので UTC 固定フォーマットで書き出す（#69）。
      // null の場合は空文字。parseCalendarDate と round-trip 可逆。
      const matchDateStr = m.matchDate
        ? formatCalendarDateForCsv(m.matchDate)
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

    const csvContent = [...ratioComment, headers.join(","), ...csvRows].join(
      "\n",
    );
    // UTF-8 BOM付きで保存 (Excelでの文字化け防止)
    const blob = new Blob(["﻿", csvContent], {
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
  }, [matches, selectedSeason, ratios, maxRatio, ratioProtocols]);

  return { exportToCsv };
};
