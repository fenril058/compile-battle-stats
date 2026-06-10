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
    // emulator は 1 プロジェクトを全テストファイルで共有し、clearFirestore() は
    // プロジェクト全体を消す。ファイル並列だと他ファイルの書き込み・削除が
    // 干渉して flaky になる（#199 調査）ため、ファイルは直列で実行する。
    fileParallelism: false,
  },
});
