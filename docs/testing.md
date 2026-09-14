# Testing & env safety

Test runner is **Vitest** (happy-dom environment; setup in `src/setupTests.ts`).

```bash
npm run test                       # all unit tests (vitest run)
npm run test:watch                 # watch mode
vitest run src/lib/logic.test.ts   # single file
npm run e2e                        # Playwright e2e (npm run e2e:ui for UI mode)
npm run test:emulator              # Firestore-emulator integration tests
```

## Unit tests never touch production

`.env` points at **production** Firebase and leaks into Vitest via `import.meta.env`.
`.env.test` (committed, empty Firebase vars) overrides it in `mode=test`, forcing
`FIREBASE_CONFIG=null` (LocalStorage mode).
As a backstop, `src/storage/firebase.ts` **throws** if a real config is ever present
under `mode=test`, so a misconfigured test can never connect to prod.

Real `onSnapshot` / `writeBatch` integration belongs in the Firebase Emulator
(`npm run test:emulator`), not unit tests.

## E2E

E2E specs live in `e2e/`, driven by `playwright.config.ts`, which starts the dev
server with `--mode e2e` → loads `.env.e2e` (empty Firebase vars) → **LocalStorage
mode**, so tests never touch real Firestore.
The Vitest config excludes `e2e/**`, so unit tests never pick up Playwright specs.

Playwright browsers are provided by `playwright-driver` in the default Nix dev shell.
Run E2E tests inside `nix develop`; no separate browser installation is required.

`@playwright/test` in `package.json` must be pinned to the **exact** version of nixpkgs' `playwright-driver` (no `^`/`~` range).
Playwright looks up its bundled Chromium by a revision tied to its own version, and nixpkgs ships the revision matching its own `playwright-driver` version.
A mismatch fails with `browserType.launch: Executable doesn't exist at ...`.

`ci.yml` doesn't run E2E, so this can only drift silently.
`just playwright-version` (`scripts/check-playwright-version.mjs`) checks that the two versions match; `just e2e` runs it first, and `.github/workflows/playwright-nix.yml` runs it in CI when `package.json`, `flake.nix`, or `flake.lock` change.

Dependabot is configured to ignore `@playwright/test`.
Bump it by hand once nixpkgs' `playwright-driver` has moved — a `flake.lock` bump PR going red on this check is the signal.
