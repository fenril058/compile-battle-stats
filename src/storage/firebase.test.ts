import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * 本番接続トリップワイヤの検証（層①の安全装置）。
 * 通常テストは .env.test により FIREBASE_CONFIG=null なので発火しないが、
 * 万一テスト中に本番設定が載った場合は firebase.ts の評価時に throw することを確認する。
 *
 * 遅延初期化リファクタ後も、この安全装置は firebase.ts のトップレベル（同期）に
 * 残してあり、import 時点で発火する（getFirebase の解決を待たない）。
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

  it("設定が null（.env.test 相当）なら throw せず disabled になる", async () => {
    vi.resetModules();
    vi.doMock("../config/env", () => ({ FIREBASE_CONFIG: null }));

    const mod = await import("./firebase");
    expect(mod.isFirebaseEnabled).toBe(false);
  });

  it("disabled のとき getFirebase は null を即 resolve する（firebaseInit を読み込まない）", async () => {
    vi.resetModules();
    vi.doMock("../config/env", () => ({ FIREBASE_CONFIG: null }));

    const mod = await import("./firebase");
    await expect(mod.getFirebase()).resolves.toBeNull();
  });
});
