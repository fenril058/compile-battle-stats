import { expect, test } from "@playwright/test";

/**
 * 言語切替（i18n）の E2E。playwright.config の `locale: ja-JP` により初期は日本語。
 * トグルで英語へ切り替えると、表示・<html lang>・localStorage が追従することを検証する。
 */
test.describe("i18n", () => {
  test("既定は日本語で、英語に切り替えると表示と lang/localStorage が追従する", async ({
    page,
  }) => {
    await page.goto("/");

    // 初期状態: 日本語（ja-JP ロケール固定）
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    const langSelect = page.getByLabel("言語");
    await expect(langSelect).toHaveValue("ja");
    await expect(page.getByText("メインコンテンツへスキップ")).toBeAttached();
    await expect(
      page.getByRole("heading", { name: "試合結果の入力" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "レシオ表" })).toBeVisible();

    // 英語へ切替
    await langSelect.selectOption("en");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Skip to main content")).toBeAttached();
    await expect(page.getByLabel("Language")).toHaveValue("en");
    // コンポーネントの可視文字列も英語へ追従する
    await expect(
      page.getByRole("heading", { name: "Record a match" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ratio Table" }),
    ).toBeVisible();

    // 永続化を確認
    const saved = await page.evaluate(() => localStorage.getItem("language"));
    expect(saved).toBe("en");

    // リロード後も英語のまま
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByLabel("Language")).toHaveValue("en");
  });
});
