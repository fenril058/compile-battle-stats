import { RATIOS, ALL_PROTOCOLS} from "../config"
import type { Protocol, Trio, Match, MatrixData,
  StatRow, StatsResult, SideStats, StatEntry
} from "../types";

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
    const firstWin = mt.winner === "FIRST";
    const secondWin = mt.winner === "SECOND";
    // ★ 修正: Trio (配列) でない場合はスキップする
    if (!Array.isArray(mt.first)
      || mt.first.length !== 3 || !Array.isArray(mt.second) || mt.second.length !== 3) {
      console.warn("Skipping invalid match data:", mt);
      continue;
    }
    const sides = [
      { t: mt.first, w: firstWin, first: true },
      { t: mt.second, w: secondWin, first: false },
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

/**
 * SideStats から StatRow[] への変換
 * @param stats - makeStatsで生成された統計結果の一部分 (SideStats)
 * @param key - どの統計項目か (single, pair, trio, first, second)
 * @param minPair - ペアの最小試合数 (configから取得)
 * @param minTrio - トリオの最小試合数 (configから取得)
 * @returns ソート・整形された StatRow の配列
 */
export const rows = (
  stats: SideStats,
  key: keyof StatsResult,
  minPair: number,
  minTrio: number
): StatRow[] => { // ← 戻り値の型を StatRow[] に指定
  const data: StatRow[] = Object.entries(stats) // ★ data の型を StatRow[] で明示
    .map(([n, { g, w }]) => ({
      n,
      g,
      w,
      l: g - w,
      p: percent(w, g),
    }))
    .filter((v) => {
      // 最小試合数に満たないデータを除外するフィルター
      if (key === "pair" && v.g < minPair) return false;
      if (key === "trio" && v.g < minTrio) return false;
      return true;
    })
    .sort((a, b) => b.p - a.p);

  return data;
};

export const matchup = (list: Match[]) => {
  const r: Record<string, StatEntry> = {};
  const bump = (k: string, w: boolean) => {
    if (!r[k]) r[k] = { g: 0, w: 0 };
    r[k].g += 1;
    if (w) r[k].w += 1;
  };

  for (const mt of list) {
    const firstWin = mt.winner === "FIRST";
    const secondWin = mt.winner === "SECOND";

    for (const lp of mt.first) {
      for (const rp of mt.second) {
        bump(`${lp}__${rp}`, firstWin);
        bump(`${rp}__${lp}`, secondWin);
      }
    }
  }

  // マトリクス初期化
  const m: MatrixData = {};
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
 * @param row - CSVの行データ ([F1, F2, F3, S1, S2, S3, Winner, ...] の形式)
 * @param validProtocols - 現在選択されているシーズンで有効なプロトコルのリスト
 * @returns Match のペイロード (id/timestampなし) または null (パース失敗)
 */
export const parseMatchCsvRow = (
  row: string[],
  validProtocols: readonly Protocol[]
): Omit<Match, "id" | "timestamp"> | null => {
  // 試合データとして最低限必要な7列 (F3  S3  Winner) があるか確認
  if (row.length < 7) return null;

  const upperRow = row.map(s => s.trim().toUpperCase());
  const [F1, F2, F3, S1, S2, S3, W, ..._rest] = upperRow;

  const protocols = [F1, F2, F3, S1, S2, S3] as Protocol[];

  // 全プロトコル名が有効なものか検証
  if (protocols.some(p => !validProtocols.includes(p))) {
      return null;
  }

  const winner = W as "FIRST" | "SECOND";
  if (winner !== "FIRST" && winner !== "SECOND") return null;

  // ratio は logic.ts の既存関数で再計算
  const ratio = isRatioBattle([F1, F2, F3] as Trio, [S1, S2, S3] as Trio);

  return {
    first: [F1, F2, F3] as Trio,
    second: [S1, S2, S3] as Trio,
    winner: winner,
    ratio: ratio,
  };
};
