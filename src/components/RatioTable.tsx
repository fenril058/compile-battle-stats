import React, { useMemo } from "react";
import { RATIOS } from "../config";
import type { Protocol } from "../types";

export const RatioTable: React.FC<{ protocols: readonly Protocol[] }> = ({ protocols }) => {
  const groups = useMemo(() => {
    const map = new Map<number, Protocol[]>();
    for (const p of protocols) {
      const score = RATIOS[p] ?? 0;
      const list = map.get(score) ?? [];
      list.push(p);
      map.set(score, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([score, list]) => ({ score, list }));
  }, [protocols]);

  return (
    <div className="mt-3 bg-zinc-900 p-3 rounded-2xl text-center">
      <h2 className="font-semibold mb-3 text-center">レシオ表</h2>
      <div className="text-sm leading-6 text-left mx-auto max-w-screen-sm">
        {groups.map(({ score, list }) => (
          <div key={score}>
            {score}点: {list.join(", ")}
          </div>
        ))}
      </div>
    </div>
  );
};
