import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * WCAG 2.x AA の自動監査。.env.e2e により LocalStorage モード・データ無しで起動する。
 *
 * データ無しの初期表示に加え、試合を登録した「データあり」状態も監査する。
 * 一覧の試合行や相性表のセルなど、データに依存して描画される UI は初期表示では
 * DOM に出てこないため、別ケースで明示的にカバーする。
 */
test.describe("a11y", () => {
  test("トップページ（データ無し）に重大な a11y 違反がない", async ({
    page,
  }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("データ登録後（一覧・相性表が描画された状態）に重大な a11y 違反がない", async ({
    page,
  }) => {
    await page.goto("/");

    // 初期値（APATHY,DARKNESS,GRAVITY vs HATE,LIFE,METAL）のまま
    // MIN_GAMES_FOR_MATRIX(=3) 戦ぶん登録し、相性表セルまで描画させる。
    const win = page.getByRole("button", { name: "先攻WIN" });
    for (let i = 1; i <= 3; i++) {
      await win.click();
      await expect(
        page.getByRole("heading", {
          name: new RegExp(`登録試合一覧\\(${i}\\)`),
        }),
      ).toBeVisible();
    }

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
