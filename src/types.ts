const PROTOCOLS_MAIN1 = [
  "DARKNESS", "FIRE", "PSYCHIC", "DEATH", "GRAVITY",
  "WATER", "LIFE", "PLAGUE", "LIGHT", "SPEED",
  "SPIRIT", "METAL", // 12種
] as const;

const PROTOCOLS_AUX1 = [
  "HATE", "LOVE", "APATHY", // 3種
] as const;

// 定義済みのリストを参照し、新しいセットは前のセットをベースに作成します（積み上げ）
export const PROTOCOL_SETS = {
  // V1: S1のベースセット
  V1: PROTOCOLS_MAIN1,

  // V1_AUX: V1 + AUX1追加分
  V1_AUX: [
    ...PROTOCOLS_MAIN1,
    ...PROTOCOLS_AUX1,
  ] as const,

  // 将来 V2 が追加される場合は、以下のように前のセットを継承
  /* V2: [
    ...PROTOCOL_SETS.V1_AUX,
    ...PROTOCOLS_MAIN2, // 新しいプロトコルがあれば、それだけを定義
  ] as const,
  */
} as const;

export type ProtocolSetKey = keyof typeof PROTOCOL_SETS;

// すべてのプロトコル（最新版）を定義（Protocol型定義のソース）
// 現在はV1_AUXが最新
export const ALL_PROTOCOLS = PROTOCOL_SETS.V1_AUX;

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

// コレクション名とプロトコルバージョンを紐づける
// シーズン名が変わっても、プロトコルセットが変わらなければ、キーは同じでOK
// 一番上がデフォルトで表示されるデータになる
export const SEASON_COLLECTIONS_CONFIG: Record<string, ProtocolSetKey> = {
  // "compile_season2_aux": "V1_AUX", // S2_AUXもV1_AUXと同じセットを使用
  // "compile_season2": "V1_AUX", // S2はS1_AUXと同じセットを使用
  "compile_season1_aux": "V1_AUX",
  "compile_season1": "V1",
} as const;

export const UNAVAILABLE_SEASONS = [
  "compile_season1"
] as const;

export type SeasonCollectionName = keyof typeof SEASON_COLLECTIONS_CONFIG;

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
