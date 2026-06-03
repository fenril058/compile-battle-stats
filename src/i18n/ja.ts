/**
 * 日本語辞書。翻訳キーの **source of truth**。
 *
 * このオブジェクトの `as const` から `TranslationKey` を導出し、`en.ts` は
 * `TranslationDict`（= 全キー必須）として型注釈する。これにより英語側のキー漏れを
 * `tsc` がコンパイル時に検出する（[[i18n]]）。
 *
 * 値の `{name}` は実行時に補間されるトークン（`t(key, { name })`）。
 * キーは `"<area>.<name>"` のフラットな命名で名前空間を表現する。
 */
export const ja = {
  // App shell
  "app.documentTitle":
    "Compile Battle Stats Tracker | ボードゲーム Compile 戦績集計・統計アプリ",
  "app.skipToMain": "メインコンテンツへスキップ",

  // Header
  "header.seasonSelect": "シーズン選択",
  "header.languageSelect": "言語",
  "header.logout": "ログアウト",
  "header.loginWithGoogle": "Googleでログイン",
} as const;

export type TranslationKey = keyof typeof ja;

/** 全キーを必須に持つ辞書型。各言語ファイルはこの型で網羅性を保証する。 */
export type TranslationDict = Record<TranslationKey, string>;
