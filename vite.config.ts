import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
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
  },
  plugins: [react(), tailwindcss()],
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
