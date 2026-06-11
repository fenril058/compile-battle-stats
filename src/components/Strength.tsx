import React, { useMemo } from "react";
import { useT } from "../i18n";
import type { StrengthModel, ThetaBootstrap } from "../lib/logic";

// スライス別 β を表示する最小試合数。少数データでの過信防止。
const MIN_GAMES_FOR_SLICE_BETA = 20;

type StrengthProps = {
  model: StrengthModel;
  normalModel?: StrengthModel;
  ratioModel?: StrengthModel;
  bootstrap?: ThetaBootstrap;
};

// 数値的に安定なロジスティック関数（β の解釈に使う）。
const sigmoid = (z: number): number =>
  z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));

// β の符号を +/− 付き文字列にフォーマット。
const formatBeta = (beta: number): string => {
  const abs = Math.abs(beta).toFixed(2);
  return beta >= 0 ? `+${abs}` : `−${abs}`;
};

export const Strength: React.FC<StrengthProps> = React.memo(
  ({ model, normalModel, ratioModel, bootstrap }) => {
    const { t } = useT();

    // θ 降順。0 中心の発散バーで強弱を表す。
    const ranked = useMemo(
      () =>
        Object.entries(model.theta)
          .map(([n, v]) => ({ n, v }))
          .sort((a, b) => b.v - a.v),
      [model.theta],
    );

    // maxAbs: 区間がある場合は |low|/|high| も含めた最大絶対値で正規化。
    // useMemo は early return の前に呼ぶ（React フック規則）。
    const maxAbs = useMemo(() => {
      let m = Math.max(...ranked.map((r) => Math.abs(r.v)));
      if (bootstrap) {
        for (const iv of Object.values(bootstrap.intervals)) {
          if (Math.abs(iv.low) > m) m = Math.abs(iv.low);
          if (Math.abs(iv.high) > m) m = Math.abs(iv.high);
        }
      }
      return m || 1;
    }, [ranked, bootstrap]);

    if (model.games === 0 || ranked.length === 0) {
      return (
        <p className="text-sm text-zinc-400 text-center py-12">
          {t("common.noData")}
        </p>
      );
    }

    const firstWin = sigmoid(model.firstAdvantage) * 100;

    // スライス別 β 表示の有無を判定。
    const showNormal =
      normalModel !== undefined &&
      normalModel.games >= MIN_GAMES_FOR_SLICE_BETA;
    const showRatio =
      ratioModel !== undefined && ratioModel.games >= MIN_GAMES_FOR_SLICE_BETA;
    const showSlice = showNormal || showRatio;

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
        {showSlice && (
          <div className="mb-3">
            <p className="text-[10px] text-zinc-400 mb-1">
              {t("strength.betaBySlice.heading")}
            </p>
            {showNormal && normalModel && (
              <p className="text-[10px] text-zinc-300">
                {t("strength.betaBySlice.normal", {
                  rate: (sigmoid(normalModel.firstAdvantage) * 100).toFixed(1),
                  beta: formatBeta(normalModel.firstAdvantage),
                  games: normalModel.games,
                })}
              </p>
            )}
            {showRatio && ratioModel && (
              <p className="text-[10px] text-zinc-300">
                {t("strength.betaBySlice.ratio", {
                  rate: (sigmoid(ratioModel.firstAdvantage) * 100).toFixed(1),
                  beta: formatBeta(ratioModel.firstAdvantage),
                  games: ratioModel.games,
                })}
              </p>
            )}
          </div>
        )}
        {bootstrap && (
          <p className="text-[10px] text-zinc-500 mb-1">
            {t("strength.bootstrapNote", { samples: bootstrap.samples })}
          </p>
        )}
        <ul className="space-y-0.5" aria-label={t("strength.title")}>
          {ranked.map((r, i) => {
            // |θ| をトラック半幅(50%)に正規化。
            const pct = (Math.abs(r.v) / maxAbs) * 50;
            const positive = r.v >= 0;
            const iv = bootstrap?.intervals[r.n];

            // bootstrap 区間線の計算（発散バーと同じ 50% 中心スケール）。
            // low..high を left/right/width に変換する。
            let ciStyle: React.CSSProperties | undefined;
            let ciPositive: boolean | undefined;
            if (iv !== undefined) {
              const loAbs = iv.low;
              const hiAbs = iv.high;
              // 区間の左端と右端をトラック上の位置（0=左端, 100=右端）に変換。
              // トラック中心=50%、各単位は (1/maxAbs)*50 %。
              const leftPct = 50 + (loAbs / maxAbs) * 50;
              const rightPct = 50 + (hiAbs / maxAbs) * 50;
              const widthPct = rightPct - leftPct;
              // 区間が正側にある場合は緑、負側は赤、0またぎは黄色。
              ciPositive =
                iv.low >= 0 ? true : iv.high <= 0 ? false : undefined;
              ciStyle = {
                left: `${Math.max(0, leftPct)}%`,
                width: `${Math.min(100 - Math.max(0, leftPct), widthPct)}%`,
              };
            }

            const ariaLabel =
              iv !== undefined
                ? t("strength.rowWithCi", {
                    n: r.n,
                    theta: r.v.toFixed(2),
                    low: iv.low.toFixed(2),
                    high: iv.high.toFixed(2),
                  })
                : t("strength.row", {
                    n: r.n,
                    theta: r.v.toFixed(2),
                  });

            return (
              <li
                key={r.n}
                className="flex items-center gap-1 text-xs"
                aria-label={ariaLabel}
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
                  {/* ブートストラップ区間線（細い帯）*/}
                  {ciStyle !== undefined && (
                    <span
                      className={`absolute top-1/2 h-0.5 -translate-y-1/2 rounded ${
                        ciPositive === true
                          ? "bg-green-400/60"
                          : ciPositive === false
                            ? "bg-red-400/60"
                            : "bg-yellow-400/60"
                      }`}
                      style={ciStyle}
                    />
                  )}
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
  },
);
