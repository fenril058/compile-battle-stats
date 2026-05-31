import { expect, test } from "@playwright/test";

/**
 * local（LocalStorage）モードの write 経路の e2e。
 * .env.e2e により認証無効・Firestore 非接続で起動する。
 *
 * #48 B 案により local がログイン不要で書けるハーネスになったため、
 * 「未ログインでフォーム登録 → 一覧に反映」を実ブラウザで検証する。
 * （従来 import/add/remove の write 経路は e2e で一度も実行されていなかった）
 */
test.describe("local write paths", () => {
  test("未ログインでもフォーム登録でき、一覧に反映される", async ({ page }) => {
    await page.goto("/");

    // 初期は 0 件
    await expect(
      page.getByRole("heading", { name: /登録試合一覧\(0\)/ }),
    ).toBeVisible();

    // ログイン不要で登録できる
    await page.getByRole("button", { name: "先攻WIN" }).click();

    // 1 件に増え、ログイン要求は出ない
    await expect(
      page.getByRole("heading", { name: /登録試合一覧\(1\)/ }),
    ).toBeVisible();
    await expect(page.getByText("ログインが必要です")).toHaveCount(0);
  });
});
