// --- 1. プロトコル定義 ---
const PROTOCOLS_MAIN1 = [
  "DARKNESS",
  "FIRE",
  "PSYCHIC",
  "DEATH",
  "GRAVITY",
  "WATER",
  "LIFE",
  "PLAGUE",
  "LIGHT",
  "SPEED",
  "SPIRIT",
  "METAL",
] as const;

const PROTOCOLS_AUX1 = ["HATE", "LOVE", "APATHY"] as const;

const PROTOCOLS_MAIN2 = [
  "LUCK",
  "WAR",
  "COURAGE",
  "TIME",
  "CLARITY",
  "FEAR",
  "CORRUPTION",
  "SMOKE",
  "CHAOS",
  "MIRROR",
  "ICE",
  "PEACE",
] as const;

const PROTOCOLS_AUX2 = ["DIVERSITY", "UNITY", "ASSIMILATION"] as const;

export const PROTOCOL_SETS = {
  V1: PROTOCOLS_MAIN1,
  V1_AUX: [...PROTOCOLS_MAIN1, ...PROTOCOLS_AUX1] as const,
  V2: [
    ...PROTOCOLS_MAIN1,
    ...PROTOCOLS_AUX1,
    ...PROTOCOLS_MAIN2,
    ...PROTOCOLS_AUX2,
  ] as const,
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
  LUCK: "LUC",
  WAR: "WAR",
  COURAGE: "COU",
  TIME: "TIM",
  CLARITY: "CLA",
  FEAR: "FEA",
  CORRUPTION: "COR",
  SMOKE: "SMO",
  CHAOS: "CHA",
  MIRROR: "MIR",
  ICE: "ICE",
  PEACE: "PEA",
  DIVERSITY: "DIV",
  UNITY: "UNI",
  ASSIMILATION: "ASS",
};

// --- 2. レシオ定義 ---
const RATIOS_V1 = {
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
} as const;

const RATIOS_V3 = {
  DARKNESS: 5,
  FIRE: 5,
  HATE: 5,
  PSYCHIC: 6,
  DEATH: 2,
  GRAVITY: 3,
  WATER: 2,
  LIFE: 3,
  LOVE: 2,
  PLAGUE: 1,
  LIGHT: 0,
  SPEED: 3,
  SPIRIT: 1,
  APATHY: 0,
  METAL: 0,
} as const;

const RATIOS_main2 = {
  LUCK: 9,
  WAR: 9,
  COURAGE: 9,
  TIME: 9,
  CLARITY: 9,
  FEAR: 9,
  CORRUPTION: 9,
  SMOKE: 9,
  CHAOS: 9,
  MIRROR: 9,
  ICE: 9,
  PEACE: 9,
  DIVERSITY: 9,
  UNITY: 9,
  ASSIMILATION: 9,
};

export const RATIO_SETS = {
  V1: RATIOS_V1,
  V2: { ...RATIOS_V1, ...RATIOS_main2, SPEED: 2, PLAGUE: 1, WATER: 2, LIFE: 3 },
  V3: { ...RATIOS_V3, ...RATIOS_main2 },
} as const;

// --- 3. シーズン定義 ---
// key はアプリ内で扱うID (URLパラメータやlocalStorageのキーになる)
export const SEASONS_CONFIG = {
  compile_season3: {
    displayName: "Season 3",
    collectionName: "compile_season3",
    protocolVer: "V2",
    ratioVer: "V3",
    isReadOnly: true,
    maxRatio: 8,
  },
  compile_season2: {
    displayName: "Season 2",
    collectionName: "compile_season2",
    protocolVer: "V2",
    ratioVer: "V2",
    isReadOnly: false,
    maxRatio: 8,
  },
  compile_season1_aux: {
    displayName: "Season 1 (Aux)",
    collectionName: "compile_season1_aux", // Firestoreのコレクション名
    protocolVer: "V1_AUX", // PROTOCOL_SETS のキー
    ratioVer: "V1", // RATIO_SETS のキー
    isReadOnly: true,
    maxRatio: 8, // レシオ上限も設定に持たせるとより柔軟
  },
  compile_season1: {
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
