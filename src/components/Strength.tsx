import React, { useMemo } from "react";
import { useT } from "../i18n";
import type { StrengthModel } from "../utils/logic";

type StrengthProps = {
  model: StrengthModel;
};

// 数値的に安定なロジスティック関数（β の解釈に使う）。
const sigmoid = (z: number): number =>
  z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));

export const Strength: React.FC<StrengthProps> = React.memo(({ model }) => {
  const { t } = useT();

  // θ 降順。0 中心の発散バーで強弱を表す。
  const ranked = useMemo(
    () =>
      Object.entries(model.theta)
        .map(([n, v]) => ({ n, v }))
        .sort((a, b) => b.v - a.v),
    [model.theta],
  );

  if (model.games === 0 || ranked.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-12">
        {t("common.noData")}
      </p>
    );
  }

  const maxAbs = Math.max(...ranked.map((r) => Math.abs(r.v))) || 1;
  const firstWin = sigmoid(model.firstAdvantage) * 100;

  return (
    <div>
      <p className="text-xs text-zinc-300 mb-1">
        {t("strength.firstAdvantage", {
          rate: firstWin.toFixed(1),
          beta: model.firstAdvantage.toFixed(2),
        })}
      </p>
      <p className="text-[10px] text-zinc-500 mb-1">
        {t("strength.note", { games: model.games })}
      </p>
      <p className="text-[10px] text-zinc-400 mb-2">
        {t("strength.logitNote")}
      </p>
      <ul className="space-y-0.5" aria-label={t("strength.title")}>
        {ranked.map((r, i) => {
          // |θ| をトラック半幅(50%)に正規化。
          const pct = (Math.abs(r.v) / maxAbs) * 50;
          const positive = r.v >= 0;
          return (
            <li
              key={r.n}
              className="flex items-center gap-1 text-xs"
              aria-label={t("strength.row", { n: r.n, theta: r.v.toFixed(2) })}
            >
              <span className="w-4 text-right text-zinc-500 tabular-nums">
                {i + 1}
              </span>
              <span className="w-16 truncate" title={r.n}>
                {r.n}
              </span>
              {/* 0 を中心とした発散バー（右=強い/緑, 左=弱い/赤）。視覚情報なので
                  aria-hidden（行の aria-label が同内容を読み上げる）。 */}
              <span
                aria-hidden="true"
                className="relative flex-1 h-3 rounded bg-zinc-800"
              >
                <span
                  className="absolute top-0 bottom-0 border-l border-zinc-600"
                  style={{ left: "50%" }}
                />
                <span
                  className={`absolute top-1/2 h-1.5 -translate-y-1/2 rounded ${
                    positive ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={
                    positive
                      ? { left: "50%", width: `${pct}%` }
                      : { right: "50%", width: `${pct}%` }
                  }
                />
              </span>
              <span className="w-12 text-right tabular-nums">
                {r.v.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
