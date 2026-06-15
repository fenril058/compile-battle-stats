import React, { useEffect, useState } from "react";
import { useT } from "../i18n";
import type { TranslationKey } from "../i18n/ja";
import type { TrioRecommendation } from "../lib/logic";

const ALL_SCOPES = ["all", "main1", "main1ratio", "main2"] as const;
type Scope = (typeof ALL_SCOPES)[number];
const SCOPE_LABELS: Record<Scope, TranslationKey> = {
  all: "trio.scope.all",
  main1: "trio.scope.main1",
  main1ratio: "trio.scope.main1ratio",
  main2: "trio.scope.main2",
};

type TrioRecommendProps = {
  recommendations: {
    all: readonly TrioRecommendation[];
    main1: readonly TrioRecommendation[];
    main1ratio: readonly TrioRecommendation[];
    main2: readonly TrioRecommendation[];
  };
  hasMain2Protocols?: boolean;
};

const SCORE_HIGH = 60;
const SCORE_LOW = 40;

// 残差/勝率の符号付き文字列（pp 表示用）。
const signed = (v: number): string => `${v > 0 ? "+" : ""}${v.toFixed(1)}`;

export const TrioRecommend: React.FC<TrioRecommendProps> = React.memo(
  ({ recommendations, hasMain2Protocols = false }) => {
    const { t } = useT();
    const [scope, setScope] = useState<Scope>("all");

    const visibleScopes = ALL_SCOPES.filter(
      (s) => s !== "main2" || hasMain2Protocols,
    );

    useEffect(() => {
      if (scope === "main2" && !hasMain2Protocols) setScope("all");
    }, [hasMain2Protocols, scope]);

    const list = recommendations[scope];

    return (
      <div>
        <fieldset className="flex flex-wrap items-center gap-1 mb-2 border-0 p-0 m-0 min-w-0">
          <legend className="text-xs text-zinc-400 mr-1 p-0 float-left">
            {t("trio.scopeLabel")}
          </legend>
          {visibleScopes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              aria-pressed={scope === s}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                scope === s
                  ? "bg-zinc-500 text-white font-medium"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {t(SCOPE_LABELS[s])}
            </button>
          ))}
        </fieldset>

        {list.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-12">
            {t("common.noData")}
          </p>
        ) : (
          <>
            <p className="text-[10px] text-zinc-400 mb-2">{t("trio.note")}</p>
            <ul aria-label={t("trio.title")} className="space-y-0.5">
              {list.map((rec, i) => {
                const dot =
                  rec.score > SCORE_HIGH
                    ? "bg-green-400"
                    : rec.score < SCORE_LOW
                      ? "bg-red-400"
                      : "bg-zinc-400";
                return (
                  <li
                    key={rec.label}
                    className="flex items-center gap-1 text-xs"
                    aria-label={t("trio.row", {
                      label: rec.label,
                      score: rec.score.toFixed(1),
                      base: rec.base.toFixed(1),
                      synergy: signed(rec.synergy),
                      pairs: rec.pairsWithData,
                    })}
                  >
                    <span className="w-5 text-right text-zinc-500 tabular-nums">
                      {i + 1}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`inline-block w-2 h-2 rounded-full shrink-0 ${dot}`}
                    />
                    <span className="flex-1 truncate" title={rec.label}>
                      {rec.label}
                    </span>
                    <span className="w-12 text-right tabular-nums font-medium">
                      {rec.score.toFixed(1)}%
                    </span>
                    <span className="w-40 text-right text-zinc-500 tabular-nums hidden sm:inline">
                      {t("trio.breakdown", {
                        base: rec.base.toFixed(1),
                        synergy: signed(rec.synergy),
                      })}
                    </span>
                    <span className="w-16 text-right text-zinc-500 tabular-nums">
                      {t("trio.pairData", { pairs: rec.pairsWithData })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    );
  },
);
