import type React from "react";
import { type TranslationKey, useT } from "../i18n";

type ExplainerProps = {
  /** 折りたたみの本文（解説テキスト）の翻訳キー。改行は `\n` で表現する。 */
  bodyKey: TranslationKey;
  /** summary ラベルの翻訳キー。既定は共通の「解説」。 */
  summaryKey?: TranslationKey;
};

/**
 * 各分析ブロックの読み方を補足する折りたたみ解説。
 * 既定では閉じており、`<summary>` をクリックで本文を開く。
 * 本文は `whitespace-pre-line` で `\n` を改行として描画する。
 */
export const Explainer: React.FC<ExplainerProps> = ({
  bodyKey,
  summaryKey = "common.explainer",
}) => {
  const { t } = useT();
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer select-none text-zinc-400 hover:text-zinc-300">
        {t(summaryKey)}
      </summary>
      <p className="mt-1 leading-relaxed whitespace-pre-line text-zinc-400">
        {t(bodyKey)}
      </p>
    </details>
  );
};
