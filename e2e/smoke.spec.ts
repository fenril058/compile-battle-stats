import { expect, test } from "@playwright/test";

/**
 * 低優先度の表示系（App の配線 / Header / Footer / DataToolbar / RatioTable）が
 * 実ブラウザで描画されることのスモークテスト。
 * .env.e2e により LocalStorage モードで起動するので外部 I/O は発生しない。
 */
test.describe("smoke", () => {
  test("トップページが LocalStorage モードで主要 UI を描画する", async ({
    page,
  }) => {
    await page.goto("/");

    // Header（タイトル / モード表示 / シーズン選択）
    await expect(
      page.getByRole("heading", { name: "BattleStats" }),
    ).toBeVisible();
    await expect(page.getByText("Local Mode")).toBeVisible();
    await expect(page.getByLabel("シーズン選択")).toBeVisible();

    // RatioTable
    await expect(page.getByRole("heading", { name: "レシオ表" })).toBeVisible();

    // DataToolbar
    await expect(
      page.getByRole("button", { name: "CSV Export" }),
    ).toBeVisible();

    // Footer
    await expect(page.getByRole("link", { name: "@fenril_nh" })).toBeVisible();
  });

  test("シーズンを切り替えられる", async ({ page }) => {
    await page.goto("/");

    const select = page.getByLabel("シーズン選択");
    await expect(select).toHaveValue("compile_season3");

    await select.selectOption("compile_season1");
    await expect(select).toHaveValue("compile_season1");
  });
});
