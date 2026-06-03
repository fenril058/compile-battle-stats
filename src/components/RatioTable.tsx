import type React from "react";
import { useMemo } from "react";
import { useT } from "../i18n";
import type { Protocol, Ratios } from "../types";

export const RatioTable: React.FC<{
  protocols: readonly Protocol[];
  ratios: Ratios;
}> = ({ protocols, ratios }) => {
  const { t } = useT();
  const groups = useMemo(() => {
    const map = new Map<number, Protocol[]>();
    for (const p of protocols) {
      const score = ratios[p];
      if (score === undefined) continue;
      const list = map.get(score) ?? [];
      list.push(p);
      map.set(score, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([score, list]) => ({ score, list }));
  }, [protocols, ratios]);

  return (
    <div className="mt-3 bg-zinc-900 p-3 rounded-2xl text-center">
      <h2 className="font-semibold mb-3 text-center">
        {t("ratioTable.title")}
      </h2>
      <div className="text-sm leading-6 text-left mx-auto max-w-screen-sm">
        {groups.map(({ score, list }) => (
          <div key={score}>
            {t("ratioTable.row", { score, list: list.join(", ") })}
          </div>
        ))}
      </div>
    </div>
  );
};
