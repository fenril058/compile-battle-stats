const PROTOCOLS_MAIN1 = [
  "DARKNESS", "FIRE", "PSYCHIC", "DEATH", "GRAVITY",
  "WATER", "LIFE", "PLAGUE", "LIGHT", "SPEED",
  "SPIRIT", "METAL", // 12種
] as const;

const PROTOCOLS_AUX1 = [
  "HATE", "LOVE", "APATHY", // 3種
] as const;

export const ALL_PROTOCOLS = [
  ...PROTOCOLS_MAIN1,
  ...PROTOCOLS_AUX1,
] as const;

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

// --- シーズンごとのプロトコルセットの定義 ---
export const PROTOCOL_SETS = {
  // S2_AUX: ALL_PROTOCOLS,
  // S2: ALL_PROTOCOLS,
  S1_AUX: ALL_PROTOCOLS,
  S1: PROTOCOLS_MAIN1,
} as const;

// コレクション名とプロトコルセットキーのマッピング
export const SEASON_COLLECTIONS_CONFIG = {
  // "compile_season2_aux": "S2_AUX",
  // "compile_season2": "S2",
  "compile_season1_aux": "S1_AUX",
  "compile_season1": "S1",
} as const;

export type SeasonCollectionName = keyof typeof SEASON_COLLECTIONS_CONFIG;
export type ProtocolSetKey = (typeof SEASON_COLLECTIONS_CONFIG)[SeasonCollectionName];

export const ABBR: Record<Protocol, string> = {
  DARKNESS: "DAR",
  FIRE: "FIR",
  HATE: "HAT",
  PSYCHIC: "PSY",
  DEATH: "DEA",
  GRAVITY: "GRA",
  WATER: "WAT",
  LIFE: "LIF",
  LOVE: "LOV",
  PLAGUE: "PLA",
  LIGHT: "LIG",
  SPEED: "SPE",
  SPIRIT: "SPI",
  APATHY: "APA",
  METAL: "MET",
};

export const RATIOS: Record<Protocol, number> = {
  DARKNESS: 5,
  FIRE: 5,
  HATE: 5,
  PSYCHIC: 5,
  DEATH: 3,
  GRAVITY: 3,
  WATER: 3,
  LIFE: 2,
  LOVE: 2,
  PLAGUE: 2,
  LIGHT: 1,
  SPEED: 1,
  SPIRIT: 1,
  APATHY: 0,
  METAL: 0,
};
