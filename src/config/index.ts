// ゲームルール定義: protocols / ratios / seasons / 統計閾値
// （ランタイム設定〔Firebase 環境変数〕は ./env を参照）

// --- 1. プロトコル定義 ---
const PROTOCOLS_V1_MAIN = [
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

const PROTOCOLS_V1_AUX = ["HATE", "LOVE", "APATHY"] as const;

const PROTOCOLS_V2_MAIN = [
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

const PROTOCOLS_V2_AUX = ["DIVERSITY", "UNITY", "ASSIMILATION"] as const;

export const PROTOCOL_SETS = {
  V1: PROTOCOLS_V1_MAIN,
  V1_AUX: [...PROTOCOLS_V1_MAIN, ...PROTOCOLS_V1_AUX] as const,
  V2: [
    ...PROTOCOLS_V1_MAIN,
    ...PROTOCOLS_V1_AUX,
    ...PROTOCOLS_V2_MAIN,
    ...PROTOCOLS_V2_AUX,
  ] as const,
} as const;

export type ProtocolGroup = {
  readonly label: string;
  readonly protocols: readonly string[];
};

export const PROTOCOL_GROUPS: Record<
  keyof typeof PROTOCOL_SETS,
  readonly ProtocolGroup[]
> = {
  V1: [{ label: "Main 1", protocols: PROTOCOLS_V1_MAIN }],
  V1_AUX: [
    { label: "Main 1", protocols: PROTOCOLS_V1_MAIN },
    { label: "Aux 1", protocols: PROTOCOLS_V1_AUX },
  ],
  V2: [
    { label: "Main 1", protocols: PROTOCOLS_V1_MAIN },
    { label: "Aux 1", protocols: PROTOCOLS_V1_AUX },
    { label: "Main 2", protocols: PROTOCOLS_V2_MAIN },
    { label: "Aux 2", protocols: PROTOCOLS_V2_AUX },
  ],
};

// 全プロトコル（Protocol 型の基底）。実行時に扱う最新シーズン（V2）まで含めることで、
// V2 プロトコルも Protocol 型で表現でき、`as unknown` キャストを排除できる（#73）。
export const ALL_PROTOCOLS = PROTOCOL_SETS.V2;
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
const RATIOS_S1 = {
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

const RATIOS_S3 = {
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

// Season 2 時点での V2 プロトコル暫定値（レシオ対象外のため 9 点で固定）
const RATIOS_S2_V2 = {
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
} as const;

const RATIOS_S2 = {
  ...RATIOS_S1,
  ...RATIOS_S2_V2,
  SPEED: 2,
  PLAGUE: 1,
  WATER: 2,
  LIFE: 3,
} as const;

export const RATIO_SETS = {
  S1: RATIOS_S1,
  S2: RATIOS_S2,
  S3: RATIOS_S3,
} as const;

// --- 3. シーズン定義 ---
// key はアプリ内で扱うID (URLパラメータやlocalStorageのキーになる)
export const SEASONS_CONFIG = {
  compile_season3: {
    displayName: "Season 3",
    collectionName: "compile_season3",
    protocolVer: "V2",
    ratioVer: "S3",
    isReadOnly: false,
    maxRatio: 8,
    ratioProtocols: PROTOCOL_SETS.V1_AUX,
  },
  compile_season2: {
    displayName: "Season 2",
    collectionName: "compile_season2",
    protocolVer: "V2",
    ratioVer: "S2",
    isReadOnly: true,
    maxRatio: 8,
    ratioProtocols: PROTOCOL_SETS.V1_AUX,
  },
  compile_season1_aux: {
    displayName: "Season 1 (Aux)",
    collectionName: "compile_season1_aux",
    protocolVer: "V1_AUX",
    ratioVer: "S1",
    isReadOnly: true,
    maxRatio: 8,
    ratioProtocols: PROTOCOL_SETS.V1_AUX,
  },
  compile_season1: {
    displayName: "Season 1",
    collectionName: "compile_season1",
    protocolVer: "V1",
    ratioVer: "S1",
    isReadOnly: true,
    maxRatio: 8,
    ratioProtocols: PROTOCOL_SETS.V1,
  },
} as const;

// --- 4. 統計計算の閾値 ---
export const MIN_GAMES_FOR_PAIR_STATS = 5;
export const MIN_GAMES_FOR_TRIO_STATS = 3;
export const MIN_GAMES_FOR_MATRIX = 3;
