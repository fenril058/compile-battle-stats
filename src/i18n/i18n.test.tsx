import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { en } from "./en";
import { detectLang, LanguageProvider, useT } from "./index";
import { ja } from "./ja";

// 文字列中の {token} を集合として取り出す（補間トークンの整合性検証用）。
const tokensOf = (s: string): Set<string> =>
  new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

// テスト用: 翻訳結果・現在言語を描画し、ボタンで言語を切り替える小コンポーネント。
const Probe = () => {
  const { t, lang, setLang } = useT();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="text">{t("header.logout")}</span>
      <button type="button" onClick={() => setLang("en")}>
        to-en
      </button>
    </div>
  );
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("detectLang", () => {
  it("localStorage の保存値を最優先する", () => {
    localStorage.setItem("language", "en");
    expect(detectLang()).toBe("en");
  });

  it("保存値が無ければ navigator.language で判定する（en 系 → en）", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    expect(detectLang()).toBe("en");
  });

  it("保存値が無く en 系でなければ ja にフォールバックする", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");
    expect(detectLang()).toBe("ja");
  });
});

describe("useT", () => {
  it("Provider 外では既定で日本語を返す", () => {
    render(<Probe />);
    expect(screen.getByTestId("lang")).toHaveTextContent("ja");
    expect(screen.getByTestId("text")).toHaveTextContent("ログアウト");
  });

  it("保存値 en で初期化すると英語を返し <html lang> を同期する", () => {
    localStorage.setItem("language", "en");
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("text")).toHaveTextContent("Log out");
    expect(document.documentElement.lang).toBe("en");
  });

  it("setLang で切替でき、localStorage に永続化される", () => {
    localStorage.removeItem("language");
    vi.spyOn(navigator, "language", "get").mockReturnValue("ja-JP");
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("text")).toHaveTextContent("ログアウト");

    act(() => {
      screen.getByText("to-en").click();
    });

    expect(screen.getByTestId("text")).toHaveTextContent("Log out");
    expect(localStorage.getItem("language")).toBe("en");
  });
});

describe("辞書のパリティ", () => {
  const jaKeys = Object.keys(ja) as (keyof typeof ja)[];

  it("en は ja と同じキー集合を持つ", () => {
    expect(Object.keys(en).sort()).toEqual([...jaKeys].sort());
  });

  it("en の値はすべて非空", () => {
    for (const key of jaKeys) {
      expect(en[key].trim().length).toBeGreaterThan(0);
    }
  });

  it("補間トークン {token} が ja/en で一致する", () => {
    for (const key of jaKeys) {
      expect(tokensOf(en[key]), `token mismatch at "${key}"`).toEqual(
        tokensOf(ja[key]),
      );
    }
  });
});
