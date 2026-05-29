# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Type-check + Vite build
npm run typecheck    # tsc --noEmit only
npm run check        # Biome lint/format check
npm run check:fix    # Biome lint/format auto-fix
npm run test         # Run all tests (vitest run)
npm run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
vitest run src/utils/logic.test.ts
```

This repo uses a Nix-provided dev shell, so `vitest`, `biome`, `tsc`, `vite`, and
`just` are already on `PATH`. Run them directly — **do not prefix with `npx`** (it
is unnecessary and may fetch an unintended version).

Playwright (`@playwright/test`) is installed as a devDependency. Browsers are
shared in the user cache (not downloaded per-project). Run e2e tests via
`npx playwright test` (or `playwright test` if on PATH). Install browsers once
with `npx playwright install` if not already cached.

## Pre-commit / pre-push hooks (Husky)

The pre-commit hook runs `lint-staged` (Biome + secretlint on staged files), `typecheck`, `test:staged`, and `build`. Fix failures before committing; do not bypass with `--no-verify`.

## Environment

Copy `.env.example` to `.env` and fill in the Firebase credentials. When env vars are missing or empty, `src/config/env.ts` sets `FIREBASE_CONFIG` to `null`, and the app falls back to **LocalStorage mode** automatically — no Firebase required for local development.

## Architecture

### Storage modes

`useFirestore<T>` (`src/hooks/useFirestore.ts`) is the single data access layer. It detects whether Firebase is configured:
- **Remote mode**: subscribes to a Firestore collection via `onSnapshot`; mirrors data into localStorage as a cache.
- **Local mode**: reads/writes only localStorage.

The active `StorageMode` (`"remote" | "local"`) is exposed to the UI via the `mode` field.

### Season / protocol versioning

All game rules are defined in `src/config.ts`:
- `SEASONS_CONFIG` — maps a `SeasonKey` to display name, Firestore collection name, protocol version, ratio version, read-only flag, `maxRatio`, and `ratioProtocols`.
- `PROTOCOL_SETS` — protocol lists for each version (`V1`, `V1_AUX`, `V2`).
- `RATIO_SETS` — ratio values per protocol per version.
- `ALL_PROTOCOLS` is currently `V1_AUX` and drives the `Protocol` union type.

`ratioProtocols` explicitly lists the protocols eligible for ratio battles in each season. `isRatioBattle` checks this list first before comparing the ratio sum against `maxRatio`. This decouples eligibility from ratio values, so future seasons can assign real ratio values to V2 protocols without changing logic.

When adding a new season, add an entry to `SEASONS_CONFIG`. The rest of the app derives everything from that entry.

### Stats pipeline

1. `useFirestore` returns raw `Match[]`.
2. `useMatchStats` (`src/hooks/useMatchStats.ts`) splits matches into `all / normal / ratio` slices, then calls:
   - `makeStats` → `StatsResult` (single/pair/trio/first/second win rates)
   - `matchup` → `MatrixData` (protocol vs protocol win-rate matrix)
3. Results flow down to `StatsDashboard`, `Stat`, `Matrix` components.

Pure logic lives in `src/utils/logic.ts`; the hooks are thin wrappers that memoize those calculations.

### Match data model

```ts
type Match = {
  id: string;
  first: Trio;      // [Protocol, Protocol, Protocol]
  second: Trio;
  winner: "FIRST" | "SECOND";
  ratio: boolean;   // true when all protocols are ratioProtocols-eligible AND both trios' sum ≤ maxRatio
  createdAt: number;
  userId?: string;
  matchDate?: number | null;
};
```

`ratio` is computed at write time by `isRatioBattle` (in `logic.ts`), not at read time.

### Tooling

- **Formatter/Linter**: Biome (2-space indent, double quotes). Run `npm run check:fix` to auto-fix.
- **Tests**: Vitest with jsdom. Setup in `src/setupTests.ts`.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`.
- **Build**: Vite 8 with manual chunk splitting (`firebase` chunk separated from `vendor`).
