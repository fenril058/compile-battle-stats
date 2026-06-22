# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (connects to .env Firebase = PRODUCTION)
npm run dev:local    # Dev server in LocalStorage mode (no Firebase; safe for UI work)
npm run build        # Type-check + Vite build
npm run typecheck    # tsc --noEmit only
npm run check        # Biome lint/format check
npm run check:fix    # Biome lint/format auto-fix
npm run test         # Run all tests (vitest run)
npm run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
vitest run src/lib/logic.test.ts
```

This repo uses a Nix-provided dev shell, so `vitest`, `biome`, `tsc`, `vite`, and
`just` are already on `PATH`. Run them directly — **do not prefix with `npx`** (it
is unnecessary and may fetch an unintended version).

Playwright (`@playwright/test`) is installed as a devDependency. Browsers are
shared in the user cache (not downloaded per-project). Run e2e tests via
`npm run e2e` (`npm run e2e:ui` for the UI mode). Install browsers once with
`npx playwright install` if not already cached.

E2E specs live in `e2e/` and are driven by `playwright.config.ts`, which starts
the dev server with `--mode e2e`. That loads `.env.e2e` (empty Firebase vars),
forcing **LocalStorage mode** so tests never touch real Firestore. The Vitest
config excludes `e2e/**`, so unit tests never pick up Playwright specs.

`.env` points at **production** Firebase and leaks into Vitest (`import.meta.env`).
To keep unit tests off prod, `.env.test` (committed, empty Firebase vars) overrides
`.env` in `mode=test`, forcing `FIREBASE_CONFIG=null` (LocalStorage mode). As a
backstop, `src/storage/firebase.ts` **throws** if a real config is ever present under
`mode=test`, so a misconfigured test can never connect to prod. Real
`onSnapshot`/`writeBatch` integration belongs in the Firebase Emulator, not unit tests.

## Pre-commit / pre-push hooks (Husky)

The pre-commit hook runs `lint-staged` (Biome + secretlint on staged files), `typecheck`, `test:staged`, and `build`. Fix failures before committing; do not bypass with `--no-verify`.

## Git workflow

**Claude must never `git push` to `main`** — direct pushes to `main` are forbidden. Committing locally to `main` is fine; leave pushing `main` to the user, who reviews first. When a change should reach the remote on its own, create a feature branch, push it, and open a PR (branches and PRs are fine). Auto-close an issue with a `Closes #<n>` trailer on a commit that reaches `main`.

## Environment

Copy `.env.example` to `.env` and fill in the Firebase credentials. When env vars are missing or empty, `src/config/env.ts` sets `FIREBASE_CONFIG` to `null`, and the app falls back to **LocalStorage mode** automatically — no Firebase required for local development.

## Architecture

### Storage modes

`useFirestore<T>` (`src/hooks/useFirestore.ts`) is the single data access layer. It detects whether Firebase is configured:
- **Remote mode**: subscribes to a Firestore collection via `onSnapshot`; mirrors data into localStorage as a cache.
- **Local mode**: reads/writes only localStorage.

The active `StorageMode` (`"remote" | "local"`) is exposed to the UI via the `mode` field.

### Season / protocol versioning

All game rules are defined in `src/config/index.ts`:
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

Pure logic lives in `src/lib/logic.ts`; the hooks are thin wrappers that memoize those calculations.

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
- **Build**: Vite 8 with chunk splitting via `rolldownOptions.output.codeSplitting.groups` — Firebase is split into `firebase-firestore` / `firebase-auth` / `firebase-analytics` / `firebase-core` chunks, with `react-dom` and `vendor` as additional chunks.
