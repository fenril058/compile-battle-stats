import { describe, expect, it } from "vitest";
import { isConfigValid } from "./env";

/**
 * env.ts の中核は「Firebase 設定が全て揃っているか」を判定する
 * isConfigValid。これが false になると FIREBASE_CONFIG が null になり、
 * アプリは LocalStorage モードへフォールバックする（重要分岐）。
 *
 * モジュールの副作用（import.meta.env の評価）に依存せず、純粋関数として
 * 直接検証することで、テストを軽量かつ安定にしている。
 */

const fullConfig = {
  apiKey: "k",
  authDomain: "d",
  projectId: "p",
  storageBucket: "b",
  messagingSenderId: "s",
  appId: "a",
  measurementId: "m",
};

describe("config/env > isConfigValid", () => {
  it("全ての値が非空文字なら true", () => {
    expect(isConfigValid(fullConfig)).toBe(true);
  });

  it("いずれか1つでも空文字なら false（LocalStorage フォールバック）", () => {
    expect(isConfigValid({ ...fullConfig, apiKey: "" })).toBe(false);
  });

  it("いずれか1つでも undefined なら false", () => {
    expect(isConfigValid({ ...fullConfig, projectId: undefined })).toBe(false);
  });

  it("全て空文字なら false", () => {
    const empty = Object.fromEntries(
      Object.keys(fullConfig).map((k) => [k, ""]),
    );
    expect(isConfigValid(empty)).toBe(false);
  });
});
