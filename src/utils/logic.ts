import { RATIOS, ALL_PROTOCOLS} from "../config"
import type { Protocol, Trio, Match, StatsResult, SideStats, StatEntry } from "../types";

export const ratioSum = (t: Protocol[]): number =>
  t.reduce((a, p) => a + (RATIOS[p] ?? 0), 0);

export const isRatioBattle = (a: Trio, b: Trio): boolean =>
  ratioSum(a) <= 8 && ratioSum(b) <= 8;

export const percent = (w: number, g: number): number =>
  (g ? Math.round((w / g) * 1000) / 10 : 0);

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

/**
 * CSVの1行（文字列配列）を Match のペイロードにパースする。
 * @param row - CSVの行データ ([L1, L2, L3, R1, R2, R3, Winner, ...] の形式)
 * @param validProtocols - 現在選択されているシーズンで有効なプロトコルのリスト
 * @returns Match のペイロード (id/timestampなし) または null (パース失敗)
 */
export const parseMatchCsvRow = (
  row: string[],
  validProtocols: readonly Protocol[]
): Omit<Match, "id" | "timestamp"> | null => {
  // 試合データとして最低限必要な7列 (L3  R3  Winner) があるか確認
  if (row.length < 7) return null;

  const upperRow = row.map(s => s.trim().toUpperCase());
  const [L1, L2, L3, R1, R2, R3, W, ..._rest] = upperRow;

  const protocols = [L1, L2, L3, R1, R2, R3] as Protocol[];

  // 全プロトコル名が有効なものか検証
  if (protocols.some(p => !validProtocols.includes(p))) {
      return null;
  }

  const winner = W as "L" | "R";
  if (winner !== "L" && winner !== "R") return null;

  // ratio は logic.ts の既存関数で再計算
  const ratio = isRatioBattle([L1, L2, L3] as Trio, [R1, R2, R3] as Trio);

  return {
    left: [L1, L2, L3] as Trio,
    right: [R1, R2, R3] as Trio,
    winner: winner,
    ratio: ratio,
  };
};
