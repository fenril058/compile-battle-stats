import type React from "react";
import { SEASONS_CONFIG } from "../config";
import { useAuth } from "../hooks/useAuth";
import { type Lang, useT } from "../i18n";
import type { SeasonKey, StorageMode } from "../types";

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
  const { t, lang, setLang } = useT();

  const modeText = mode === "local" ? "Local Mode" : "Cloud Mode";
  const modeClass =
    mode === "local"
      ? "bg-orange-900/50 text-orange-300"
      : "bg-green-900/50 text-green-300";

  return (
    <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center max-w-7xl mx-auto gap-2">
        {/* 左側: タイトル、シーズン選択、モード表示 */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-tight">BattleStats</h1>

          {/* シーズン選択ドロップダウン */}
          <select
            value={season}
            onChange={handleSeasonChange}
            className="bg-zinc-800 border border-zinc-700 rounded text-sm py-1 px-2"
            aria-label={t("header.seasonSelect")}
          >
            {seasonCollections.map((s) => (
              <option key={s} value={s}>
                {SEASONS_CONFIG[s].displayName}
              </option>
            ))}
          </select>

          {/* ストレージモード表示  */}
          <span className={`text-xs px-2 py-0.5 rounded ${modeClass}`}>
            {modeText}
          </span>

          {/* 言語切替 */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-zinc-800 border border-zinc-700 rounded text-sm py-1 px-2"
            aria-label={t("header.languageSelect")}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* 右側: 認証ボタン/ステータス */}
        <div className="flex items-center">
          {!isAuthEnabled ? ( // Firebaseが有効でない場合
            <span className="text-red-500 text-xs">
              Offline (Firebase Disabled)
            </span>
          ) : user ? ( // ログイン済みの場合
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 whitespace-nowrap">
                {user.displayName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs bg-red-800 hover:bg-red-900 px-3 py-1 rounded
                transition-colors"
              >
                {t("header.logout")}
              </button>
            </div> // ログアウト状態の場合
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-3 py-1 rounded
              transition-colors"
            >
              {t("header.loginWithGoogle")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
