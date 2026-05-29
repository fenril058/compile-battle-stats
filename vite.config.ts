import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { beasties } from "vite-plugin-beasties";
// import { defineConfig } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "node_modules",
      "dist",
      "**/dist/**",
      "**/node_modules/**",
      ".direnv",
    ],
    environment: "jsdom", // DOM環境が必要なテストのためにjsdomを使用
    setupFiles: ["./src/setupTests.ts"], // グローバルな設定ファイル
    globals: true, // describe, test, expectなどをグローバルにする
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/setupTests.ts"],
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
