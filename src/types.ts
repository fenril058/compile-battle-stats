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
export type SideStats =Record<string, StatEntry>;

export type StatsResult = {
  single: SideStats;
  pair: SideStats;
  trio: SideStats;
  first: SideStats;
  second: SideStats;
};
