/**
 * 日本語辞書。翻訳キーの **source of truth**。
 *
 * このオブジェクトの `as const` から `TranslationKey` を導出し、`en.ts` は
 * `TranslationDict`（= 全キー必須）として型注釈する。これにより英語側のキー漏れを
 * `tsc` がコンパイル時に検出する。
 *
 * 値の `{name}` は実行時に補間されるトークン（`t(key, { name })`）。
 * キーは `"<area>.<name>"` のフラットな命名で名前空間を表現する。
 *
 * 注意: ここの日本語値は既存の単体テスト（Provider 非ラップ＝既定 ja）が
 * そのまま参照する。値を変えるとテストが落ちるため、現行表示と一致させること。
 */
export const ja = {
  // App shell
  "app.documentTitle":
    "Compile Battle Stats Tracker | ボードゲーム Compile 戦績集計・統計アプリ",
  "app.skipToMain": "メインコンテンツへスキップ",

  // 共通語
  "common.first": "先攻",
  "common.second": "後攻",
  "common.ratio": "レシオ",
  "common.noData": "データなし",

  // Header
  "header.seasonSelect": "シーズン選択",
  "header.languageSelect": "言語",
  "header.logout": "ログアウト",
  "header.loginWithGoogle": "Googleでログイン",

  // MatchForm
  "matchForm.title": "試合結果の入力",
  "matchForm.matchDate": "対戦日 (任意)",
  "matchForm.swap": "🔄 入れ替え",
  "matchForm.firstWin": "先攻WIN",
  "matchForm.secondWin": "後攻WIN",
  "matchForm.reloadLocal": "ローカル再読込",
  "matchForm.registrationClosed": "登録期間が終了しました",
  "matchForm.ratioSum": "レシオ: {sum}",
  "matchForm.firstSlotAria": "先攻の {n} 番目の選択",
  "matchForm.secondSlotAria": "後攻の {n} 番目の選択",
  "matchForm.toast.loginRequired": "ログインが必要です",
  "matchForm.toast.seasonNotAllowed":
    "このシーズンは登録が許可されていません。",
  "matchForm.toast.invalidProtocols": "プロトコルが正しく選択されていません。",
  "matchForm.toast.cancelledFixInput":
    "試合登録をキャンセルしました。入力を修正してください。",
  "matchForm.toast.cancelledInterTeam":
    "試合登録をキャンセルしました。（チーム間重複を修正してください）",
  "matchForm.confirm.intraTeam":
    "【重要】チーム内のプロトコルに重複があります。この試合データは統計計算から除外されますが、登録してよろしいですか？\n\n[OK]：登録を続行\n[キャンセル]：入力を修正",
  "matchForm.confirm.interTeam":
    "警告：先攻と後攻のプロトコルが重複しています（例: A, B, C vs C, D, E）。この試合は統計に反映されますが、意図した入力かご確認ください。\n\n[OK]：登録を続行\n[キャンセル]：入力を修正",

  // MatchList
  "matchList.title": "登録試合一覧({count})",
  "matchList.caption": "登録試合一覧",
  "matchList.header.registeredAt": "登録日",
  "matchList.header.winner": "勝者",
  "matchList.header.matchDate": "対戦日",
  "matchList.empty": "試合が登録されていません。",
  "matchList.pageSize": "表示件数:",
  "matchList.paginationTop": "ページネーション（上部）",
  "matchList.paginationBottom": "ページネーション（下部）",
  "matchList.prevPage": "前のページ",
  "matchList.nextPage": "次のページ",
  "matchList.pageStatus": "{current} / {total} ページ",
  "matchList.delete": "削除",
  "matchList.confirmDelete": "確認",
  "matchList.cancelDelete": "戻る",

  // StatsDashboard
  "statsDashboard.statView": "統計ビュー",
  "statsDashboard.matrixView": "相性表ビュー",
  "statsDashboard.view.all": "全体",
  "statsDashboard.view.main1": "Main1",
  "statsDashboard.view.main2": "Main2",
  "statsDashboard.view.mixed": "混合",
  "statsDashboard.matrix.ratio": "レシオ(Main1)",
  "statsDashboard.displayRange": "表示範囲:",
  "statsDashboard.appearedOnly": "出現のみ",
  "statsDashboard.allProtocols": "全プロトコル",
  "statsDashboard.matrixEmpty": "{games} 戦以上の対戦データがまだありません。",
  "statsDashboard.pairListSummary": "出現ペア一覧（実験的）",
  "statsDashboard.matrixTitle": "{name} 相性表",
  "statsDashboard.stat.normal": "通常戦",
  "statsDashboard.stat.combined": "通常+レシオ",
  "statsDashboard.statTypeAria": "統計種別",

  // Stat
  "stat.tab.single": "単体",
  "stat.tab.pair": "2枚組",
  "stat.tab.trio": "3枚組",
  "stat.section.single": "プロトコル単体勝率",
  "stat.section.pair": "プロトコル2枚組勝率",
  "stat.section.trio": "プロトコル3枚組勝率",
  "stat.section.first": "先攻時の勝率",
  "stat.section.second": "後攻時の勝率",
  "stat.minGames": "{label}（{games}戦以上）",
  "stat.sortNote": "Wilson 下限で並べ替え（95%信頼区間）",
  "stat.oldTable": "旧表示（表）",
  "stat.ci.aria": "{n}: 勝率 {p}%、95%信頼区間 {low}〜{high}%、{g}戦",

  // Matrix
  "matrix.gamesHeading": "{title}（{games} 戦以上）",

  // MatrixPairList
  "matrixPairList.empty": "{games} 戦以上の対戦ペアがまだありません",
  "matrixPairList.caption": "出現ペア一覧（{games} 戦以上）",
  "matrixPairList.attacker": "攻",
  "matrixPairList.defender": "受",

  // RatioTable
  "ratioTable.title": "レシオ表",
  "ratioTable.row": "{score}点: {list}",

  // DataToolbar
  "dataToolbar.importLabel": "CSVから試合データをインポート",
  "dataToolbar.selectFile": "ファイルを選択",
  "dataToolbar.reimportNote":
    "※ 本アプリがエクスポートした CSV ファイルを再インポートできます",

  // ErrorBoundary（Provider 外の class なので detectLang() で静的に引く）
  "errorBoundary.title": "エラーが発生しました",
  "errorBoundary.description":
    "ページを再読み込みするか、localStorage をクリアして再試行してください。",
  "errorBoundary.reload": "再読み込み",
  "errorBoundary.clearReload": "localStorage をクリアして再読み込み",

  // ProtocolSelect
  "protocolSelect.noOptions": "一致するプロトコルがありません",
} as const;

export type TranslationKey = keyof typeof ja;

/** 全キーを必須に持つ辞書型。各言語ファイルはこの型で網羅性を保証する。 */
export type TranslationDict = Record<TranslationKey, string>;
