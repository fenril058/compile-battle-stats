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

Browsers are shared in the user cache (not downloaded per-project);
install once with `npx playwright install` if not already cached.
