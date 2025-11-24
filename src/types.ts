export const PROTOCOLS_FULL = [
  "DARKNESS",
  "FIRE",
  "HATE",
  "PSYCHIC",
  "DEATH",
  "GRAVITY",
  "WATER",
  "LIFE",
  "LOVE",
  "PLAGUE",
  "LIGHT",
  "SPEED",
  "SPIRIT",
  "APATHY",
  "METAL",
] as const;

export type Protocol = (typeof PROTOCOLS_FULL)[number];

export type Trio = [Protocol, Protocol, Protocol];

export type Match = {
  id: string;
  left: Trio;
  right: Trio;
  winner: "L" | "R";
  ratio: boolean;
  timestamp: number;
};

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
