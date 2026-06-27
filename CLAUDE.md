# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Commands & gotchas

```bash
npm run dev          # Dev server — connects to .env Firebase = PRODUCTION data
npm run dev:local    # LocalStorage mode (no Firebase; safe for UI work)
npm run check:fix    # Biome lint/format auto-fix
npm run test         # Vitest (the test runner)
```

This repo uses a Nix-provided dev shell, so `vitest`, `biome`, `tsc`, `vite`, and
`just` are already on `PATH`. Run them directly — **do not prefix with `npx`** (it is
unnecessary and may fetch an unintended version).

Testing, e2e, and the safeguards that keep tests off production Firebase live in
[`docs/testing.md`](docs/testing.md) — read it before writing or running tests.

## Git workflow & hooks

**Claude must never `git push` to `main`** — direct pushes to `main` are forbidden.
Committing locally to `main` is fine; leave pushing `main` to the user, who reviews
first. When a change should reach the remote on its own, create a feature branch, push
it, and open a PR. Auto-close an issue with a `Closes #<n>` trailer on a commit that
reaches `main`.

Husky hooks: **pre-commit** runs `lint-staged` (Biome + secretlint), `typecheck`,
`test:staged`; **pre-push** runs `build`. Fix failures; do not bypass with
`--no-verify`.

## Architecture

### Storage modes

`useFirestore<T>` (`src/hooks/useFirestore.ts`) is the single data access layer. When
Firebase is configured it subscribes to a Firestore collection via `onSnapshot` and
mirrors data into localStorage as a cache (**remote** mode); when env vars are missing
(`FIREBASE_CONFIG=null`) it reads/writes only localStorage (**local** mode). The active
`StorageMode` (`"remote" | "local"`) is exposed to the UI via the `mode` field.

### Season / protocol versioning

All game rules are defined in `src/config/index.ts`:
- `SEASONS_CONFIG` — maps a `SeasonKey` to display name, Firestore collection name, protocol version, ratio version, read-only flag, `maxRatio`, and `ratioProtocols`.
- `PROTOCOL_SETS` — protocol lists per version (`V1`, `V1_AUX`, `V2`).
- `RATIO_SETS` — ratio values per protocol per version.
- `ALL_PROTOCOLS` is currently `V1_AUX` and drives the `Protocol` union type.

`ratioProtocols` explicitly lists the protocols eligible for ratio battles in each
season. `isRatioBattle` checks this list first before comparing the ratio sum against
`maxRatio`, decoupling eligibility from ratio values (so future seasons can give V2
protocols real ratio values without changing logic). To add a season, add a
`SEASONS_CONFIG` entry — the rest of the app derives everything from it.

### Stats pipeline

1. `useFirestore` returns raw `Match[]`.
2. `useMatchStats` (`src/hooks/useMatchStats.ts`) splits matches into `all / normal / ratio` slices, then calls `makeStats` → `StatsResult` (single/pair/trio/first/second win rates) and `matchup` → `MatrixData` (protocol-vs-protocol win-rate matrix).
3. Results flow to `StatsDashboard`, `Stat`, `Matrix` components.

Pure logic lives in `src/lib/logic.ts`; the hooks are thin memoizing wrappers.

A `Match`'s `ratio` flag is computed at **write** time by `isRatioBattle` (in
`logic.ts`), not at read time — `true` only when every protocol is
`ratioProtocols`-eligible and both trios' ratio sums are ≤ `maxRatio`.

### Tooling notes

- Formatter/linter is **Biome** (`npm run check:fix` to auto-fix).
- **Tailwind CSS v4** via `@tailwindcss/vite` — configured in CSS; there is no `tailwind.config.js`.
