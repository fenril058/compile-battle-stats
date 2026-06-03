/**
 * 英語辞書。`TranslationDict` 注釈により `ja.ts` の全キー網羅を強制する
 * （キーが欠ければ `tsc --noEmit` が失敗する）。
 */
import type { TranslationDict } from "./ja";

export const en: TranslationDict = {
  // App shell
  "app.documentTitle":
    "Compile Battle Stats Tracker | Win-rate stats for the board game Compile",
  "app.skipToMain": "Skip to main content",

  // Header
  "header.seasonSelect": "Season",
  "header.languageSelect": "Language",
  "header.logout": "Log out",
  "header.loginWithGoogle": "Sign in with Google",
};
