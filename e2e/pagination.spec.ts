import { expect, test } from "@playwright/test";

/**
 * ページネーション縮小・シーズン切替の回帰 E2E。
 *
 * - #200 回帰: 2 ページ目で削除して件数が 1 ページに収まるとき、
 *   テーブルが空にならず「1 / 1 ページ」相当が表示されること。
 * - シーズン切替: season3 データ有りの状態で season2 に切替 → 0 件表示、
 *   season3 に戻すとデータが復活すること。
 *
 * .env.e2e により LocalStorage モードで動く（Firestore 未接続）。
 * playwright.config の `locale: ja-JP` により表示は日本語固定。
 */

/** compile_season3 の LocalStorage キーにシードする 11 件の Match データ */
const SEED_MATCHES = Array.from({ length: 11 }, (_, i) => ({
  id: `seed-${i + 1}`,
  // チーム内でプロトコルが重複しない組み合わせを使う
  first: ["DARKNESS", "FIRE", "HATE"] as [string, string, string],
  second: ["PSYCHIC", "GRAVITY", "WATER"] as [string, string, string],
  winner: i % 2 === 0 ? "FIRST" : "SECOND",
  ratio: false,
  createdAt: 1_700_000_000_000 + i * 1000, // 新しいものが後ろ（降順ソート後に最新が先頭）
  matchDate: null,
}));

test.describe("pagination", () => {
  test("2 ページ目の削除後にテーブルが空にならず 1 / 1 ページ表示になる (#200 回帰)", async ({
    page,
  }) => {
    // LocalStorage にデータをシードしてからページを開く
    await page.addInitScript((matches) => {
      // createdAt 降順にソート済みの状態で保存する（LocalAdapter の仕様に合わせる）
      const sorted = [...matches].sort((a, b) => b.createdAt - a.createdAt);
      localStorage.setItem("compile_season3", JSON.stringify(sorted));
    }, SEED_MATCHES);

    await page.goto("/");

    // 11 件が読み込まれていることを確認
    await expect(
      page.getByRole("heading", { name: /登録試合一覧\(11\)/ }),
    ).toBeVisible();

    // デフォルトの表示件数は 10 件なので 2 ページ目がある
    // 「次のページ」ボタンは上部ページネーションの方を使う（1 つ目）
    const nextButtons = page.getByRole("button", { name: "次のページ" });
    await nextButtons.first().click();

    // 2 ページ目（1 件だけ表示されるはず）
    await expect(
      page.getByRole("button", { name: "削除" }).first(),
    ).toBeVisible();

    // 2 ページ目の 1 件を削除
    await page.getByRole("button", { name: "削除" }).first().click();
    // 確認ボタンをクリック
    await page.getByRole("button", { name: "確認" }).click();

    // 10 件になったことを確認
    await expect(
      page.getByRole("heading", { name: /登録試合一覧\(10\)/ }),
    ).toBeVisible();

    // テーブルが空にならないこと（「試合が登録されていません。」が出ないこと）
    await expect(page.getByText("試合が登録されていません。")).toHaveCount(0);

    // ページ表示が「1 / 1 ページ」になっていること（上部ページネーション）
    const pageStatus = page.getByText(/1 \/ 1 ページ/).first();
    await expect(pageStatus).toBeVisible();
  });

  test("シーズン切替でデータが正しく切り替わる", async ({ page }) => {
    // compile_season3 に 11 件シード
    await page.addInitScript((matches) => {
      const sorted = [...matches].sort((a, b) => b.createdAt - a.createdAt);
      localStorage.setItem("compile_season3", JSON.stringify(sorted));
    }, SEED_MATCHES);

    await page.goto("/");

    // season3 に 11 件あることを確認
    await expect(
      page.getByRole("heading", { name: /登録試合一覧\(11\)/ }),
    ).toBeVisible();

    // Season 2 に切り替える
    const select = page.getByLabel("シーズン選択");
    await select.selectOption("compile_season2");

    // season2 にはデータがないので 0 件になること
    await expect(
      page.getByRole("heading", { name: /登録試合一覧\(0\)/ }),
    ).toBeVisible();

    // Season 3 に戻す
    await select.selectOption("compile_season3");

    // season3 のデータが再表示されること
    await expect(
      page.getByRole("heading", { name: /登録試合一覧\(11\)/ }),
    ).toBeVisible();
  });
});
