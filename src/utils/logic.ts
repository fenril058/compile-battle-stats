import { ALL_PROTOCOLS, MIN_GAMES_FOR_MATRIX } from "../config";
import type {
  Match,
  MatrixData,
  Protocol,
  Ratios,
  SideStats,
  StatEntry,
  StatRow,
  StatsResult,
  Trio,
} from "../types";
import { parseCalendarDate } from "./date";

// ratios を引数で受け取る
export const ratioSum = (t: Trio, ratios: Ratios): number =>
  t.reduce((a, p) => a + (ratios[p] ?? 0), 0);

// ratios と maxRatio(閾値) と ratioProtocols(レシオ対象プロトコル) を受け取る
export const isRatioBattle = (
  a: Trio,
  b: Trio,
  ratios: Ratios,
  maxRatio: number,
  ratioProtocols: ReadonlyArray<string>,
): boolean => {
  const allEligible = (t: Trio) => t.every((p) => ratioProtocols.includes(p));
  if (!allEligible(a) || !allEligible(b)) return false;
  return ratioSum(a, ratios) <= maxRatio && ratioSum(b, ratios) <= maxRatio;
};

export const percent = (w: number, g: number): number =>
  g ? Math.round((w / g) * 1000) / 10 : 0;

/**
 * 統計集計の対象となる「妥当なトリオ」かを判定する。
 * 長さが 3 で、チーム内にプロトコルの重複が無いこと。
 * makeStats（単体/ペア/トリオ/先後）と countMatchups（相性表）の双方で共有し、
 * 「不正な試合」の定義が両者で食い違わないようにする。
 */
export const isValidTrio = (trio: Trio): boolean => {
  // 1. 長さが3であること
  if (trio.length !== 3) return false;
  // 2. 重複がないこと
  if (new Set(trio).size !== 3) return false;
  return true;
};

export const makeStats = (list: Match[]): StatsResult => {
  // 初期化
  const s: StatsResult = {
    single: {},
    pair: {},
    trio: {},
    first: {},
    second: {},
  };

  const bump = (m: SideStats, k: string, w: boolean) => {
    if (!m[k]) m[k] = { g: 0, w: 0 };
    m[k].g += 1;
    if (w) m[k].w += 1;
  };

  for (const mt of list) {
    const firstValid = isValidTrio(mt.first);
    const secondValid = isValidTrio(mt.second);

    // どちらかのチーム構成が不正なら、この試合全体を統計から除外する
    if (!firstValid || !secondValid) {
      // 開発者向けにログを出力
      console.warn(`Skipping invalid match ID: ${mt.id}.
      Reason: Invalid Trio structure (Duplicated/Incorrect length protocols).`);
      continue;
    }

    const firstWin = mt.winner === "FIRST";
    const secondWin = mt.winner === "SECOND";

    const sides = [
      { t: mt.first, w: firstWin, first: true },
      { t: mt.second, w: secondWin, first: false },
    ];

    for (const side of sides) {
      // Single
      side.t.forEach((p) => {
        bump(s.single, p, side.w);
      });

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
      side.t.forEach((p) => {
        bump(side.first ? s.first : s.second, p, side.w);
      });
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
  minTrio: number,
): StatRow[] => {
  // ← 戻り値の型を StatRow[] に指定
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

// 有向ペア (a__b) ごとの対戦数/勝利数を集計する内部ヘルパー。
// matchup（行列表現）と matchupPairs（リスト表現）で共有する。
const countMatchups = (list: Match[]): Record<string, StatEntry> => {
  const r: Record<string, StatEntry> = {};
  const bump = (k: string, w: boolean) => {
    if (!r[k]) r[k] = { g: 0, w: 0 };
    r[k].g += 1;
    if (w) r[k].w += 1;
  };

  for (const mt of list) {
    // makeStats と同じ妥当性判定で不正な試合（チーム内重複など）を除外し、
    // 相性表と各統計で「不正な試合」の扱いを揃える（#67）。
    if (!isValidTrio(mt.first) || !isValidTrio(mt.second)) continue;

    const firstWin = mt.winner === "FIRST";
    const secondWin = mt.winner === "SECOND";

    for (const lp of mt.first) {
      for (const rp of mt.second) {
        bump(`${lp}__${rp}`, firstWin);
        bump(`${rp}__${lp}`, secondWin);
      }
    }
  }

  return r;
};

export const matchup = (
  list: Match[],
  protocols: readonly Protocol[] = ALL_PROTOCOLS,
) => {
  const r = countMatchups(list);

  const m: MatrixData = {};
  for (const a of protocols) {
    m[a] = {};
    for (const b of protocols) {
      m[a][b] = null;
    }
  }
  for (const [k, v] of Object.entries(r)) {
    const [aStr, bStr] = k.split("__");
    const a = aStr as Protocol;
    const b = bStr as Protocol;
    if (m[a] && v.g >= MIN_GAMES_FOR_MATRIX) {
      m[a][b] = percent(v.w, v.g);
    }
  }

  return m;
};

// 相性表（行列）の別表現。MIN_GAMES_FOR_MATRIX 以上戦った有向ペアだけを
// リスト化して返す。疎な相性表（全試合 30×30 など）で巨大な空セルを描かずに済む。
// 戦数降順 → 勝率降順でソート。
export type MatchupPair = {
  a: Protocol;
  b: Protocol;
  g: number;
  w: number;
  l: number;
  p: number;
};

export const matchupPairs = (list: Match[]): MatchupPair[] => {
  const r = countMatchups(list);

  const pairs: MatchupPair[] = [];
  for (const [k, v] of Object.entries(r)) {
    if (v.g < MIN_GAMES_FOR_MATRIX) continue;
    const [aStr, bStr] = k.split("__");
    pairs.push({
      a: aStr as Protocol,
      b: bStr as Protocol,
      g: v.g,
      w: v.w,
      l: v.g - v.w,
      p: percent(v.w, v.g),
    });
  }

  pairs.sort((x, y) => (y.g !== x.g ? y.g - x.g : y.p - x.p));
  return pairs;
};

export const parseMatchCsvRow = (
  row: string[],
  validProtocols: readonly Protocol[],
  ratios: Ratios,
  maxRatio: number,
  ratioProtocols: ReadonlyArray<string>,
): Omit<Match, "id" | "createdAt"> | null => {
  // 試合データとして最低限必要な7列 (F3  S3  Winner) があるか確認
  if (row.length < 7) return null;

  const upperRow = row.map((s) => s.trim().toUpperCase());
  const [F1, F2, F3, S1, S2, S3, W, DateStr] = upperRow;

  // 先に文字列のまま検証し、妥当性が確認できてから Protocol/Trio として扱う（#73）。
  const rawProtocols = [F1, F2, F3, S1, S2, S3];
  const validSet: ReadonlySet<string> = new Set(validProtocols);
  if (rawProtocols.some((p) => !validSet.has(p))) {
    return null;
  }

  // W は文字列。値で絞り込めば winner は Winner に絞られる（キャスト不要）。
  if (W !== "FIRST" && W !== "SECOND") return null;
  const winner = W;

  const firstTrio = [F1, F2, F3] as Trio;
  const secondTrio = [S1, S2, S3] as Trio;

  // 注入された ratios を使用して計算
  const ratio = isRatioBattle(
    firstTrio,
    secondTrio,
    ratios,
    maxRatio,
    ratioProtocols,
  );

  // 対戦日 (matchDate) のパース処理。
  // "2025/12/03" / "2025-12-03" などの暦日を UTC 真夜中として解釈する（#69）。
  // 空文字・不正な日付は null。
  const matchDate = parseCalendarDate(DateStr);

  return {
    first: firstTrio,
    second: secondTrio,
    winner: winner,
    ratio: ratio,
    matchDate: matchDate,
  };
};
