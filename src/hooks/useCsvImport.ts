import type React from "react";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useT } from "../i18n";
import { parseMatchCsvRow } from "../lib/logic";
import type { Match, Protocol, Ratios } from "../types";

// useFirestoreから渡される add 関数用の型定義
type AddMatchItemBatch = (payload: Omit<Match, "id">[]) => Promise<void>;

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
 * ファイル選択時の処理、CSVのパース、マッチデータのバリデーションと登録を行います。
 * @param addMatchItem - 試合データを保存するための非同期関数 (useFirestoreから取得)
 * @param currentProtocols - 現在のシーズンで有効なプロトコルのリスト
 * @param currentRatios - 現在のシーズンでのレシオ
 * @param maxRatio - 現在のシーズンでのレシオ値の上限
 * @returns handleImportCsv 関数 (React.ChangeEvent<HTMLInputElement>を受け取る)
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
        toast.error("CSVファイルを選択してください。");
        return;
      }

      // ファイルリーダーで内容を読み込み
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.trim().split("\n");

        const payloadsToImport: Omit<Match, "id">[] = [];
        let failCount = 0;
        let firstFailLine = "";

        // 行頭が '#' の行と空行をスキップ
        const dataLines = lines.filter((line) => {
          // trimStart()で行頭の空白を除去し、空行と'#'で始まるコメント行をスキップする
          const trimmedLine = line.trimStart();
          return trimmedLine.length > 0 && !trimmedLine.startsWith("#");
        });

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

            // Batch処理するための配列に追加 (createdAt / 所有者 userId も含める)
            payloadsToImport.push({ ...payload, createdAt, userId });
          } else {
            failCount++;
            if (failCount === 1) firstFailLine = line;
            console.warn("CSV Row Parse Failed:", line);
          }
        }

        // ▼ 【変更】 ループが終わった後に、まとめて保存を実行
        if (payloadsToImport.length > 0) {
          await addMatchItemBatch(payloadsToImport);
        }

        if (failCount > 0) {
          toast.warn(
            `${failCount}件失敗（先頭例: ${firstFailLine.substring(0, 50)}…）プロトコル名や形式を確認してください。`,
          );
        }
      };

      reader.readAsText(file);
      // ファイル入力の値をリセットし、同じファイルを再度選択できるようにする（ブラウザの仕様対応）
      event.target.value = "";
    },
    [
      addMatchItemBatch,
      currentProtocols,
      ratios,
      maxRatio,
      ratioProtocols,
      userId,
      requireLogin,
      t,
    ],
  );

  return { handleImportCsv };
};
