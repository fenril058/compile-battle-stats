import type React from 'react';
import { useRef } from 'react';

interface DataToolbarProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRegistrationAllowed: boolean;
}

export const DataToolbar: React.FC<DataToolbarProps> = ({
  onExport,
  onImport,
  isRegistrationAllowed,
}) => {
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
          <label htmlFor="csv-import-file" className="font-semibold mb-3 text-zinc-300">
            CSVから試合データをインポート
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
              ファイルを選択
            </button>
          </div>

          <p className="text-xs text-zinc-400 mt-2">
            （形式: F1, F2, F3, S1, S2, S3, Winner, matchDate）
          </p>
        </div>
      )}
    </div>
  );
};
