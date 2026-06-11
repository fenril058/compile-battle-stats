import type React from "react";
import { useRef } from "react";
import type { ImportPreview } from "../hooks/useCsvImport";
import { useT } from "../i18n";

/** プレビューパネルに表示する失敗行の最大件数 */
const MAX_FAILURE_EXAMPLES = 5;
/** 失敗行を切り詰める最大文字数 */
const MAX_FAILURE_LINE_LENGTH = 50;

interface DataToolbarProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRegistrationAllowed: boolean;
  preview?: ImportPreview | null;
  onConfirmImport?: () => void;
  onCancelImport?: () => void;
}

export const DataToolbar: React.FC<DataToolbarProps> = ({
  onExport,
  onImport,
  isRegistrationAllowed,
  preview,
  onConfirmImport,
  onCancelImport,
}) => {
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-8 mb-6">
      {/* Export Button */}
      <button
        type="button"
        onClick={onExport}
        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
      >
        CSV Export
      </button>

      {/* Import Section */}
      {isRegistrationAllowed && (
        <div className="flex flex-col items-center justify-center p-4 border border-zinc-700 rounded-lg bg-zinc-900/30 w-full max-w-md">
          <label
            htmlFor="csv-import-file"
            className="font-semibold mb-3 text-zinc-300"
          >
            {t("dataToolbar.importLabel")}
          </label>

          <div>
            <input
              id="csv-import-file"
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={onImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleFileSelectClick}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
            >
              {t("dataToolbar.selectFile")}
            </button>
          </div>

          <p className="text-xs text-zinc-400 mt-2">
            {t("dataToolbar.formatNote")}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {t("dataToolbar.reimportNote")}
          </p>

          {/* プレビューパネル */}
          {preview != null && (
            <div className="mt-4 w-full border border-zinc-600 rounded-lg bg-zinc-800/60 p-3 text-sm">
              {/* サマリ行 */}
              <p className="text-zinc-200 font-medium">
                {t("dataToolbar.preview.summary", {
                  ok: String(preview.payloads.length),
                  fail: String(preview.failures.length),
                })}
              </p>

              {/* 失敗行の例（先頭5件） */}
              {preview.failures.length > 0 && (
                <div className="mt-2">
                  <p className="text-zinc-400 text-xs mb-1">
                    {t("dataToolbar.preview.failedExamples")}
                  </p>
                  <ul className="space-y-0.5">
                    {preview.failures
                      .slice(0, MAX_FAILURE_EXAMPLES)
                      .map((line, i) => (
                        <li
                          // biome-ignore lint/suspicious/noArrayIndexKey: 同一内容の失敗行があり得るため行位置で一意化する（表示専用・並べ替え無し）
                          key={`${i}-${line}`}
                          className="font-mono text-xs text-red-400 truncate"
                        >
                          {line.length > MAX_FAILURE_LINE_LENGTH
                            ? `${line.substring(0, MAX_FAILURE_LINE_LENGTH)}…`
                            : line}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* 確定・キャンセルボタン */}
              <div className="mt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onCancelImport}
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs transition-colors"
                >
                  {t("dataToolbar.preview.cancel")}
                </button>
                <button
                  type="button"
                  onClick={onConfirmImport}
                  disabled={preview.payloads.length === 0}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                >
                  {t("dataToolbar.preview.confirm")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
