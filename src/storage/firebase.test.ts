import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * 本番接続トリップワイヤの検証（層①の安全装置）。
 * 通常テストは .env.test により FIREBASE_CONFIG=null なので発火しないが、
 * 万一テスト中に本番設定が載った場合は firebase.ts の評価時に throw することを確認する。
 */
describe("firebase 本番接続トリップワイヤ", () => {
  afterEach(() => {
    vi.doUnmock("../config/env");
    vi.resetModules();
  });

  it("テスト中に本番設定が紛れ込むと import 時に throw する", async () => {
    vi.resetModules();
    vi.doMock("../config/env", () => ({
      FIREBASE_CONFIG: {
        apiKey: "k",
        authDomain: "a",
        projectId: "prod-project",
        storageBucket: "s",
        messagingSenderId: "m",
        appId: "x",
        measurementId: "g",
      },
    }));

    await expect(import("./firebase")).rejects.toThrow(
      /本番 Firebase 設定が検出されました/,
    );
  });

  it("設定が null（.env.test 相当）なら throw せず local モードになる", async () => {
    vi.resetModules();
    vi.doMock("../config/env", () => ({ FIREBASE_CONFIG: null }));

    const mod = await import("./firebase");
    expect(mod.db).toBeNull();
    expect(mod.isFirebaseEnabled).toBe(false);
  });
});
