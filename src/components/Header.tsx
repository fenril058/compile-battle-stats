import React from 'react';
import { useAuth } from '../hooks/useAuth';
import type { SeasonKey, StorageMode } from '../types';

type HeaderProps = {
  season: SeasonKey;
  seasonCollections: SeasonKey[];
  handleSeasonChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  mode: StorageMode;
};

export const Header: React.FC<HeaderProps> = ({
  season,
  seasonCollections,
  handleSeasonChange,
  mode,
}) => {
  // 認証ロジックをフックから取得
  const { user, handleLogin, handleLogout, isAuthEnabled } = useAuth();

  const modeText = mode === 'local' ? 'Local Mode' : 'Cloud Mode';
  const modeClass = mode === 'local' ? 'bg-orange-900/50 text-orange-300' : 'bg-green-900/50 text-green-300';


  return (
    <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex justify-between items-center max-w-7xl mx-auto">

        {/* 左側: タイトル、シーズン選択、モード表示 */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-tight">BattleStats</h1>

          {/* シーズン選択ドロップダウン */}
          <select
            value={season}
            onChange={handleSeasonChange}
            className="bg-zinc-800 border border-zinc-700 rounded text-sm py-1 px-2"
          >
            {seasonCollections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* ストレージモード表示  */}
          <span className={`text-xs px-2 py-0.5 rounded ${modeClass}`}>
            {modeText}
          </span>
        </div>

        {/* 右側: 認証ボタン/ステータス */}
        <div>
          {!isAuthEnabled ? ( // Firebaseが有効でない場合
            <span className="text-red-500 text-xs">Offline (Firebase Disabled)</span>
          ) : user ? ( // ログイン済みの場合
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 whitespace-nowrap">
                {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs bg-red-800 px-3 py-1 rounded"
              >
                 ログアウト
              </button>
            </div>
          ) : ( // ログアウト状態の場合
            <button
              onClick={handleLogin}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded"
            >
               Googleでログイン
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
