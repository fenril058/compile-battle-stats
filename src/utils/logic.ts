import {RATIOS, ALL_PROTOCOLS} from "../config"
import type { Protocol, Trio, Match } from "../types";

export const ratioSum = (t: Protocol[]): number =>
  t.reduce((a, p) => a + (RATIOS[p] ?? 0), 0);

export const isRatioBattle = (a: Trio, b: Trio): boolean =>
  ratioSum(a) <= 8 && ratioSum(b) <= 8;

export const percent = (w: number, g: number): number =>
  (g ? Math.round((w / g) * 1000) / 10 : 0);

// makeStats で使用する型定義
type StatEntry = { g: number; w: number };
type SideStats =Record<string, StatEntry>;

export type StatsResult = {
  single: SideStats;
  pair: SideStats;
  trio: SideStats;
  first: SideStats;
  second: SideStats;
};

export const makeStats = (list: Match[]): StatsResult => {
  // 初期化
  const s: StatsResult = { single: {}, pair: {}, trio: {}, first: {}, second: {} };

  const bump = (m: SideStats, k: string, w: boolean) => {
    if (!m[k]) m[k] = { g: 0, w: 0 };
    m[k].g += 1;
    if (w) m[k].w += 1;
  };

  for (const mt of list) {
    const leftWin = mt.winner === "L";
    const rightWin = mt.winner === "R";

    const sides = [
      { t: mt.left, w: leftWin, first: true },
      { t: mt.right, w: rightWin, first: false },
    ];

    for (const side of sides) {
      // Single
      side.t.forEach((p) => bump(s.single, p, side.w));

      // Pair
      for (let i = 0; i < 3; i += 1) {
        for (let j = i + 1; j < 3; j += 1) {
          const key = [side.t[i], side.t[j]].sort().join(" · ");
          bump(s.pair, key, side.w);
        }
      }

      // Trio
      const trioKey = [...side.t].sort().join(" · ");
      bump(s.trio, trioKey, side.w);

      // First/Second
      side.t.forEach((p) => bump(side.first ? s.first : s.second, p, side.w));
    }
  }

  return s;
};

export const rows = (
  m: SideStats,
  filterType?: "pair" | "trio" | string,
  minPair: number = 5, //default値
  minTrio: number = 3, //default値
) =>
  Object.entries(m)
    .map(([k, v]) => ({
      n: k,
      g: v.g,
      w: v.w,
      l: v.g - v.w,
      p: percent(v.w, v.g),
  }))
    .filter((r) => {
    if (filterType === "pair") return r.g >= minPair;
    if (filterType === "trio") return r.g >= minTrio;
    return true;
  })
    .sort((a, b) => b.p - a.p);

export const matchup = (list: Match[]) => {
  const r: Record<string, StatEntry> = {};
  const bump = (k: string, w: boolean) => {
    if (!r[k]) r[k] = { g: 0, w: 0 };
    r[k].g += 1;
    if (w) r[k].w += 1;
  };

  for (const mt of list) {
    const leftWin = mt.winner === "L";
    const rightWin = mt.winner === "R";

    for (const lp of mt.left) {
      for (const rp of mt.right) {
        bump(`${lp}__${rp}`, leftWin);
        bump(`${rp}__${lp}`, rightWin);
      }
    }
  }

  // マトリクス初期化
  const m: Record<string, Record<string, number | null>> = {};
  ALL_PROTOCOLS.forEach((a) => {
    m[a] = {};
    ALL_PROTOCOLS.forEach((b) => {
      m[a][b] = null;
    });
  });

  for (const [k, v] of Object.entries(r)) {
    const [a, b] = k.split("__");
    if (v.g >= 3) m[a][b] = percent(v.w, v.g);
  }

  return m;
};
