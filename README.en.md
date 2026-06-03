# compile-battle-stats

[日本語](README.md) | **English**

A web app for recording and aggregating match results of the card game "Compile".

## Overview

Manage match data for "Compile" — a game played by drafting three protocols — and
visualize statistics such as win rates and matchups. When Firebase is not
configured, the app runs entirely on local storage, so you can develop locally
without Firebase.

## Features

- Record match results (three protocols each for the first and second player, plus the winner)
- Automatic detection of ratio battles (matches where the sum of both sides' ratios is within the cap)
  - The ratio system is a community-designed rule set.
  - Each protocol is assigned a number (ratio) according to its strength, and you draft so the total is 8 or less.
  - For details, see [Compile ratio system adjustments (season3)](https://note.com/purple_ztmy/n/n7939f19dbdec) (Japanese).
  - `ratioProtocols` controls, per season, which protocols can take part in ratio battles. V2 protocols are currently excluded from ratio battles.
- Per-season statistics
  - Win rates for single protocols / two-protocol combinations / three-protocol combinations
  - Win rates by first/second player
  - Protocol-vs-protocol matchup matrix
- Remote sharing via Firebase (Firestore) / offline operation via local storage

## Setup

```bash
npm install
```

To use Firebase, copy `.env.example` to `.env` and fill in your Firebase
credentials. If `.env` is missing or empty, the app runs in local storage mode.

```bash
cp .env.example .env
# Edit .env and enter your Firebase credentials
```

## Development

```bash
npm run dev       # Start the dev server
npm run build     # Type-check + build
npm run check:fix # Auto-fix formatting/lint with Biome
npm run test      # Run tests
```

## Seasons

| Season | Protocol set | Ratio-eligible | Writable |
|---------|--------------|----------|--------|
| Season 3 | V2 (24) | V1_AUX (15) | Yes |
| Season 2 | V2 (24) | V1_AUX (15) | No |
| Season 1 (Aux) | V1_AUX (15) | V1_AUX (15) | No |
| Season 1 | V1 (12) | V1 (12) | No |

To add a new season, add an entry to `SEASONS_CONFIG` in `src/config/index.ts`.
The main fields are:

| Field | Description |
|-----------|-----|
| `protocolVer` | Protocol set to use (a key of `PROTOCOL_SETS`) |
| `ratioVer` | Ratio value set (a key of `RATIO_SETS`: `"S1"` / `"S2"` / `"S3"` …) |
| `ratioProtocols` | List of protocols eligible for ratio battles (a value of `PROTOCOL_SETS`) |
| `maxRatio` | Ratio cap |
| `isReadOnly` | Write-disabled flag |

## Tech stack

- **Frontend**: React 19 + TypeScript 6
- **Build**: Vite 8
- **Styling**: Tailwind CSS v4
- **Database**: Firebase Firestore (optional) / localStorage (fallback)
- **Tests**: Vitest
- **Linter / Formatter**: Biome
