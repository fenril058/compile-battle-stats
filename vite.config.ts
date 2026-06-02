import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { beasties } from "vite-plugin-beasties";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "node_modules",
      "dist",
      "**/dist/**",
      "**/node_modules/**",
      ".direnv",
      "e2e/**", // Playwright の E2E は vitest 対象外
      "**/*.emulator.test.*", // Emulator 連動テストは npm run test:emulator 専用
    ],
    environment: "jsdom", // DOM環境が必要なテストのためにjsdomを使用
    setupFiles: ["./src/setupTests.ts"], // グローバルな設定ファイル
    globals: true, // describe, test, expectなどをグローバルにする
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/setupTests.ts",
        "src/main.tsx", // アプリのブートストラップ（テスト対象外）
      ],
      thresholds: {
        // 全体の下限（新規 UI の追加で薄まり過ぎないための床）
        statements: 80,
        branches: 74,
        functions: 78,
        lines: 81,
        // 高カバレッジ資産は個別に固定し、グローバル床に隠れたサイレント劣化を防ぐ。
        // 値は実測からわずかに下げた（ノイズ耐性のためのバッファ）。
        "src/utils/logic.ts": {
          statements: 98,
          branches: 94,
          functions: 100,
          lines: 99,
        },
        "src/storage/**": {
          statements: 92,
          branches: 80,
          functions: 100,
          lines: 95,
        },
        "src/hooks/useMatchStats.ts": {
          statements: 95,
          branches: 85,
          functions: 92,
          lines: 94,
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    beasties({
      // optional beasties configuration
      options: {
        preload: "swap",
        pruneSource: false, // Disable pruning CSS files
        inlineThreshold: 4000, // Inline stylesheets smaller than 4kb
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase";
            return "vendor";
          }
        },
      },
    },
  },
});
