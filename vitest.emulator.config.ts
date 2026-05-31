import { defineConfig } from "vitest/config";

// Emulator 連動テスト（層②）専用の設定。
// `*.emulator.test.ts` だけを対象にし、node 環境で実行する。
// 通常の `vitest run`（vite.config.ts）はこれらを除外しているので、
// emulator 無しでは走らない。`npm run test:emulator` 経由でのみ実行する
// （firebase emulators:exec が Firestore エミュレータを起動した中で動く）。
export default defineConfig({
  test: {
    include: ["src/**/*.emulator.test.{ts,tsx}"],
    environment: "node",
    globals: true,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
