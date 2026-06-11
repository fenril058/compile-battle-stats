import type React from "react";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useT } from "../i18n";
import { parseMatchCsvRow } from "../lib/logic";
import type { Match, Protocol, Ratios } from "../types";

// useFirestoreから渡される add 関数用の型定義
type AddMatchItemBatch = (payload: Omit<Match, "id">[]) => Promise<void>;

export type ImportPreview = {
  payloads: Omit<Match, "id">[];
  failures: string[];
};

// RFC 4180 対応の簡易 CSV パーサー
// ダブルクオートで囲まれたフィールド内のカンマを許容、クオート除去を行う
const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされたクオート: ""
        current += '"';
        i++; // 次の " をスキップ
      } else {
        // クオートの開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // フィールド区切り
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
};

/**
 * CSVインポート機能を提供するカスタムフック。
 * ファイル選択時はプレビューを保存し、confirmImport で確定登録する2段階フロー。
 * @param addMatchItem - 試合データを保存するための非同期関数 (useFirestoreから取得)
 * @param currentProtocols - 現在のシーズンで有効なプロトコルのリスト
 * @param currentRatios - 現在のシーズンでのレシオ
 * @param maxRatio - 現在のシーズンでのレシオ値の上限
 * @returns handleImportCsv / preview / confirmImport / cancelImport
 */
export const useCsvImport = (
  addMatchItemBatch: AddMatchItemBatch,
  currentProtocols: readonly Protocol[],
  ratios: Ratios,
  maxRatio: number,
  ratioProtocols: ReadonlyArray<string>,
  // 一括登録するデータに付与する所有者 uid（remote モードで未ログインなら undefined）。
  // Firestore ルールが create 時に userId == auth.uid を要求するため、ここで付与する。
  userId?: string,
  // remote モードで未ログインのとき true。インポートをログイン要求トーストで中断する。
  requireLogin = false,
) => {
  const { t } = useT();
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const handleImportCsv = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (requireLogin) {
        toast.error(t("dataToolbar.toast.loginRequired"));
        event.target.value = "";
        return;
      }

      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const mimeTypes = ["text/csv", "application/vnd.ms-excel"];
      const isCsv = mimeTypes.includes(file.type) || file.name.endsWith(".csv");

      if (!isCsv) {
        toast.error(t("dataToolbar.toast.selectCsv"));
        return;
      }

      // ファイルリーダーで内容を読み込み
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.trim().split("\n");

        const payloadsToImport: Omit<Match, "id">[] = [];
        const failureLines: string[] = [];

        // 行頭が '#' の行と空行をスキップ
        const dataLines = lines.filter((line) => {
          // trimStart()で行頭の空白を除去し、空行と'#'で始まるコメント行をスキップする
          const trimmedLine = line.trimStart();
          return trimmedLine.length > 0 && !trimmedLine.startsWith("#");
        });

        // データ行が1行も無い場合は何もしない
        if (dataLines.length === 0) return;

        // CSVを解析し、マッチデータを追加
        for (const line of dataLines) {
          // RFC 4180対応パーサーでクオート除去
          const row = parseCsvLine(line).map((s) => s.toUpperCase());

          // logic.ts で定義したパーサーで検証・変換
          const payload = parseMatchCsvRow(
            row,
            currentProtocols,
            ratios,
            maxRatio,
            ratioProtocols,
          );

          if (payload) {
            // col 9 (createdAt) をパース (存在する場合)
            let createdAt = Date.now();
            if (row.length > 9 && row[9]?.trim()) {
              const parsed = new Date(row[9]).getTime();
              if (!Number.isNaN(parsed)) {
                createdAt = parsed;
              }
            }

            // プレビュー用配列に追加 (createdAt / 所有者 userId も含める)
            payloadsToImport.push({ ...payload, createdAt, userId });
          } else {
            failureLines.push(line);
            console.warn("CSV Row Parse Failed:", line);
          }
        }

        // addBatch せずにプレビューを state に保存する
        setPreview({ payloads: payloadsToImport, failures: failureLines });
      };

      reader.readAsText(file);
      // ファイル入力の値をリセットし、同じファイルを再度選択できるようにする（ブラウザの仕様対応）
      event.target.value = "";
    },
    [
      currentProtocols,
      ratios,
      maxRatio,
      ratioProtocols,
      userId,
      requireLogin,
      t,
    ],
  );

  /** プレビューを確定して一括登録する */
  const confirmImport = useCallback(async () => {
    if (!preview || preview.payloads.length === 0) return;
    await addMatchItemBatch(preview.payloads);
    setPreview(null);
  }, [preview, addMatchItemBatch]);

  /** プレビューをキャンセルしてクリアする */
  const cancelImport = useCallback(() => {
    setPreview(null);
  }, []);

  return { handleImportCsv, preview, confirmImport, cancelImport };
};
