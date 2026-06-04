import React from "react";
import { useT } from "../i18n";
import type { SynergyPair } from "../utils/logic";

type SynergyProps = {
  pairs: readonly SynergyPair[];
};

export const Synergy: React.FC<SynergyProps> = React.memo(({ pairs }) => {
  const { t } = useT();

  if (pairs.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-12">
        {t("common.noData")}
      </p>
    );
  }

  const maxAbs = Math.max(...pairs.map((p) => Math.abs(p.residual))) || 1;

  return (
    <div>
      <p className="text-[10px] text-zinc-500 mb-2">{t("synergy.note")}</p>
      <ul aria-label={t("synergy.title")} className="space-y-0.5">
        {pairs.map((p) => {
          // |残差| をトラック半幅(50%)に正規化した発散バー。
          const pct = (Math.abs(p.residual) / maxAbs) * 50;
          const positive = p.residual >= 0;
          return (
            <li
              key={p.n}
              className="flex items-center gap-1 text-xs"
              aria-label={t("synergy.row", {
                n: p.n,
                residual: p.residual.toFixed(1),
                actual: p.actual.toFixed(1),
                expected: p.expected.toFixed(1),
                g: p.g,
              })}
            >
              <span className="w-28 truncate" title={p.n}>
                {p.n}
              </span>
              <span className="w-5 text-right text-zinc-500 tabular-nums">
                {p.g}
              </span>
              {/* 0 を中心とした残差バー（右=相乗/緑, 左=反シナジー/赤）。視覚情報なので
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
                {p.residual > 0 ? "+" : ""}
                {p.residual.toFixed(1)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
