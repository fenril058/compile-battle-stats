import { toast } from 'react-toastify';
import React, { useCallback } from 'react';
import type { Match, Protocol } from '../types';
import { parseMatchCsvRow } from '../utils/logic';

// useFirestoreから渡される add 関数用の型定義
type AddMatchItemBatch= (
  payload: Omit<Match, "id" | "timestamp">[]
) => Promise<void>;

/**
 * CSVインポート機能を提供するカスタムフック。
 * ファイル選択時の処理、CSVのパース、マッチデータのバリデーションと登録を行います。
 * * @param addMatchItem - 試合データを保存するための非同期関数 (useFirestoreから取得)
 * @param currentProtocols - 現在のシーズンで有効なプロトコルのリスト
 * @returns handleImportCsv 関数 (React.ChangeEvent<HTMLInputElement>を受け取る)
 */
export const useCsvImport = (
  addMatchItemBatch: AddMatchItemBatch,
  currentProtocols: readonly Protocol[]
) => {

  const handleImportCsv = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    if (file.type !== "text/csv") {
      toast.error("CSVファイルを選択してください。");
      return;
    }

    // ファイルリーダーで内容を読み込み
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');

      const payloadsToImport: Omit<Match, "id" | "timestamp">[] = [];
      let failCount = 0;

      // ヘッダー行をスキップ
      // 既存のCSVエクスポートのヘッダーは "L1,L2,L3,R1,R2,R3,WINNER,..." のようなもの
      const dataLines = lines[0].toUpperCase().includes("WINNER") ? lines.slice(1) : lines;

      // CSVを解析し、マッチデータを追加
      for (const line of dataLines) {
        // カンマ区切りでパース
        const row = line.split(',').map(s => s.trim().toUpperCase());

        // logic.ts で定義したパーサーで検証・変換
        const payload = parseMatchCsvRow(row, currentProtocols);

        if (payload) {
          // 都度書き込む方式（よくない）
          // await addMatchItem(payload); // useFirestore 経由でデータ登録 (timestamp付与)
          // Batch処理するための配列に追加
          payloadsToImport.push(payload);

        } else {
          failCount++;
          console.warn("CSV Row Parse Failed:", line);
          toast.error(`インポート失敗行（プロトコル名/形式エラー）: ${line.substring(0, 50)}...`,
            { autoClose: 5000 });
        }
      }

      // ▼ 【変更】 ループが終わった後に、まとめて保存を実行
      if (payloadsToImport.length > 0) {
        await addMatchItemBatch(payloadsToImport);
        toast.success(`${payloadsToImport.length}件の試合データをインポートしました！`);
      }

      if (failCount > 0) {
        toast.warn(`インポートに失敗したデータが${failCount}件あります。
        プロトコル名や形式を確認してください。`);
      }
    };

    reader.readAsText(file);
    // ファイル入力の値をリセットし、同じファイルを再度選択できるようにする（ブラウザの仕様対応）
    event.target.value = '';
  }, [addMatchItemBatch, currentProtocols]);

  return { handleImportCsv };
};
