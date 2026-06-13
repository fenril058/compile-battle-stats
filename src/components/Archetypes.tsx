import React from "react";
import { ABBR } from "../config";
import { useT } from "../i18n";
import type { ArchetypeMatchup } from "../lib/logic";

type ArchetypesProps = {
  data: ArchetypeMatchup;
};

const abbr = (p: string): string =>
  (ABBR as Record<string, string>)[p] ?? p.slice(0, 3);

export const Archetypes: React.FC<ArchetypesProps> = React.memo(({ data }) => {
  const { t } = useT();
  const { archetypes, matrix } = data;

  if (archetypes.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-12">
        {t("common.noData")}
      </p>
    );
  }

  const ids = archetypes.map((_, i) => `A${i + 1}`);

  return (
    <div>
      <p className="text-[10px] text-zinc-400 mb-2">{t("archetype.note")}</p>

      {/* 凡例: アーキタイプ ID → 構成プロトコル(ABBR) */}
      <ul className="text-xs text-zinc-300 mb-3 space-y-0.5 max-h-40 overflow-y-auto">
        {archetypes.map((a, i) => (
          <li key={a.id}>
            <span className="font-medium text-zinc-100">{ids[i]}</span>
            {": "}
            {a.protocols.map(abbr).join(" / ")}
          </li>
        ))}
      </ul>

      {/* アーキタイプ相性ヒートマップ（行が勝つ側） */}
      <div className="overflow-x-auto">
        <table className="text-xs border border-zinc-800">
          <caption className="sr-only">{t("archetype.title")}</caption>
          <thead className="bg-zinc-800 text-zinc-300">
            <tr>
              <th className="px-2 py-1" scope="col">
                {t("matrix.cornerLabel")}
              </th>
              {ids.map((id) => (
                <th key={id} className="px-2 py-1" scope="col">
                  {id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {archetypes.map((a, i) => (
              <tr key={a.id} className="border-t border-zinc-800 text-center">
                <th className="bg-zinc-800 px-2 py-1" scope="row">
                  {ids[i]}
                </th>
                {archetypes.map((b, j) => {
                  const v = matrix[i][j];
                  if (v === null || v === undefined) {
                    return (
                      <td key={b.id} className="p-1 text-zinc-700">
                        –
                      </td>
                    );
                  }
                  const tone =
                    v > 60
                      ? "bg-green-700/40"
                      : v < 40
                        ? "bg-red-700/40"
                        : "bg-zinc-700/40";
                  return (
                    <td key={b.id} className={`p-1 ${tone}`}>
                      {v.toFixed(0)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
