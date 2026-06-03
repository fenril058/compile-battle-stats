/**
 * 軽量 i18n 基盤（ランタイム依存ゼロ）。
 *
 * - 辞書は `ja.ts`（source of truth）と `en.ts`。
 * - 言語は初回に `localStorage("language")` → 無ければ `navigator.language` で検出。
 * - `LanguageProvider` が `document.documentElement.lang` と `document.title` を同期。
 * - Context の既定値は **ja 辞書**。Provider 外でも `useT` が日本語を返すため、
 *   Provider をラップしない既存の単体テストがそのまま緑のまま通る。
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { en } from "./en";
import { ja, type TranslationDict, type TranslationKey } from "./ja";

export type Lang = "ja" | "en";

const DICTS: Record<Lang, TranslationDict> = { ja, en };

const STORAGE_KEY = "language";

type TParams = Record<string, string | number>;
type TFunc = (key: TranslationKey, params?: TParams) => string;

/** `{token}` を params で置換する。未指定トークンは原文のまま残す。 */
const interpolate = (template: string, params?: TParams): string => {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] === undefined ? `{${k}}` : String(params[k]),
  );
};

/** localStorage の保存値 →（無ければ）ブラウザ言語の順で初期言語を決定する。 */
export const detectLang = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ja" || saved === "en") return saved;
  } catch {
    // localStorage 不可（プライベートモード等）は検出にフォールバック
  }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "ja";
};

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunc;
};

const LanguageContext = createContext<I18nContextValue>({
  lang: "ja",
  setLang: () => {},
  t: (key, params) => interpolate(ja[key], params),
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存不可でもセッション内の切替は維持する
    }
  }, []);

  const dict = DICTS[lang];

  const t = useCallback<TFunc>(
    (key, params) => interpolate(dict[key], params),
    [dict],
  );

  // <html lang> と document.title を現在の言語へ同期する。
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = dict["app.documentTitle"];
  }, [lang, dict]);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/** 翻訳関数と現在言語・切替関数を返すフック。 */
export const useT = (): I18nContextValue => useContext(LanguageContext);
