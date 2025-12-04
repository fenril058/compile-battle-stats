import type {
  ALL_PROTOCOLS,
  SEASONS_CONFIG,
  RATIO_SETS,
} from "./config";

export type StorageMode = "remote" | "local";

export type Protocol = (typeof ALL_PROTOCOLS)[number];
export type Trio = [Protocol, Protocol, Protocol];
export type Winner = "FIRST" | "SECOND";

export type Match = {
  id: string;
  first: Trio;
  second: Trio;
  winner: Winner;
  ratio: boolean;
  createdAt: number;
  userId?: string;
  matchDate?: number | null;
};

// Strict Typing for Matrix to prevent string access errors
// Allows accessing matrix[protocolA][protocolB] safely
export type MatrixData = {
  [K in Protocol]?: {
    [SubK in Protocol]?: number | null;
  };
};

// 特定の定数ではなく、RATIO_SETS の値の型を参照するようにする
export type Ratios = typeof RATIO_SETS[keyof typeof RATIO_SETS];

// SeasonCollectionName を SEASONS_CONFIG のキーから生成
export type SeasonKey = keyof typeof SEASONS_CONFIG;

// makeStats で使用する型定義
export type StatEntry = { g: number; w: number };

// SideStats は { [key: string]: StatEntry } という構造を持つ
export type SideStats = Record<string, StatEntry>;

/**
 * 統計表の1行のデータ構造を定義
 * rows 関数から返される配列の要素の型
 */
export type StatRow = {
  n: string; // 名前 (プロトコル名, ペア名, トリオ名)
  g: number; // ゲーム数 (Game)
  w: number; // 勝利数 (Win)
  l: number; // 敗北数 (Lose)
  p: number; // 勝率 (%)
};

/**
 * makeStats が返す統計結果の完全な構造
 * Stat.tsx の m prop はこの StatsResult 全体を想定しているため、型を明確にする
 */
export type StatsResult = {
  single: Record<string, { g: number; w: number }>;
  pair: Record<string, { g: number; w: number }>;
  trio: Record<string, { g: number; w: number }>;
  first: Record<string, { g: number; w: number }>;
  second: Record<string, { g: number; w: number }>;
};
