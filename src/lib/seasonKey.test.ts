import { describe, expect, it } from "vitest";
import { resolveSeasonKey } from "./seasonKey";

const VALID_KEYS = ["season_a", "season_b", "season_c"] as const;

describe("resolveSeasonKey", () => {
  it("有効なキーがそのまま返る", () => {
    expect(resolveSeasonKey("season_b", VALID_KEYS)).toBe("season_b");
  });

  it("null のとき先頭キーへフォールバック", () => {
    expect(resolveSeasonKey(null, VALID_KEYS)).toBe("season_a");
  });

  it("無効なキー（削除済みシーズン等）のとき先頭キーへフォールバック", () => {
    expect(resolveSeasonKey("old_season", VALID_KEYS)).toBe("season_a");
  });

  it("空文字のとき先頭キーへフォールバック", () => {
    expect(resolveSeasonKey("", VALID_KEYS)).toBe("season_a");
  });
});
