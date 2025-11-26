import {
  ALL_PROTOCOLS,
  RATIOS,
  ABBR,
  PROTOCOL_SETS,
  SEASON_COLLECTIONS_CONFIG,
} from "./config";

export type Protocol = (typeof ALL_PROTOCOLS)[number];

export type Trio = [Protocol, Protocol, Protocol];

export type Match = {
  id: string;
  left: Trio;
  right: Trio;
  winner: "L" | "R";
  ratio: boolean;
  timestamp: number;
};

export type Ratios = typeof RATIOS;
export type Abbr = typeof ABBR;
export type ProtocolSetKey = keyof typeof PROTOCOL_SETS;
export type SeasonCollectionName = keyof typeof SEASON_COLLECTIONS_CONFIG;

// makeStats で使用する型定義
export type StatEntry = { g: number; w: number };

// SideStats は { [key: string]: StatEntry } という構造を持つ
export type SideStats = Record<string, StatEntry>;

/**
 * makeStats が返す統計結果の完全な構造
 * Stat.tsx の m prop はこの StatsResult 全体を想定しているため、型を明確にする
 */
export type StatsResult = {
  single: SideStats; // プロトコル単体
  pair: SideStats;   // ペア
  trio: SideStats;   // トリオ
  first: SideStats;  // 1枠目
  second: SideStats; // 2枠目
};
