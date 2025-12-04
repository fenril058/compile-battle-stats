// --- 1. プロトコル定義 ---
const PROTOCOLS_MAIN1 = [
  "DARKNESS", "FIRE", "PSYCHIC", "DEATH", "GRAVITY",
  "WATER", "LIFE", "PLAGUE", "LIGHT", "SPEED",
  "SPIRIT", "METAL",
] as const;

const PROTOCOLS_AUX1 = [
  "HATE", "LOVE", "APATHY",
] as const;

export const PROTOCOL_SETS = {
  V1: PROTOCOLS_MAIN1,
  V1_AUX: [...PROTOCOLS_MAIN1, ...PROTOCOLS_AUX1] as const,
} as const;

// 最新のプロトコル（型定義用）
export const ALL_PROTOCOLS = PROTOCOL_SETS.V1_AUX;
export const ABBR = {
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


// --- 2. レシオ定義 ---
const RATIOS_V1 = {
  DARKNESS: 5, FIRE: 5, HATE: 5, PSYCHIC: 5,
  DEATH: 3, GRAVITY: 3, WATER: 3,
  LIFE: 2, LOVE: 2, PLAGUE: 2,
  LIGHT: 1, SPEED: 1, SPIRIT: 1,
  APATHY: 0, METAL: 0,
} as const;

export const RATIO_SETS = {
  V1: RATIOS_V1,
  V2: { ...RATIOS_V1, SPEED: 2, PLAGUE: 1, WATER: 2, LIFE: 3  },
} as const;


// --- 3. シーズン定義 ---
// key はアプリ内で扱うID (URLパラメータやlocalStorageのキーになる)
export const SEASONS_CONFIG = {
  "compile_season2": {
    displayName: "Season 2",
    collectionName: "compile_season2",
    protocolVer: "V1",
    ratioVer: "V2",
    isReadOnly: true,
    maxRatio: 8,
  },
  "compile_season1_aux": {
    displayName: "Season 1 (Aux)",
    collectionName: "compile_season1_aux", // Firestoreのコレクション名
    protocolVer: "V1_AUX",                 // PROTOCOL_SETS のキー
    ratioVer: "V1",                        // RATIO_SETS のキー
    isReadOnly: false,
    maxRatio: 8,                           // レシオ上限も設定に持たせるとより柔軟
  },
  "compile_season1": {
    displayName: "Season 1",
    collectionName: "compile_season1",
    protocolVer: "V1",
    ratioVer: "V1",
    isReadOnly: true, // 書き込み不可
    maxRatio: 8,
  },
} as const;

// --- 4. 統計計算の閾値 ---
export const MIN_GAMES_FOR_PAIR_STATS = 5;
export const MIN_GAMES_FOR_TRIO_STATS = 3;
export const MIN_GAMES_FOR_MATRIX = 3;
