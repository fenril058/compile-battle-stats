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
  "common.explainer": "解説",

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
  "statsDashboard.residualTitle": "{name} 相性残差（実測 − モデル期待）",
  "statsDashboard.residualNote":
    "正(緑)＝個々の強さ以上に有利、負(赤)＝不利。交絡を外したカウンター関係。",
  "statsDashboard.residualExplain":
    "数字は「行のプロトコル 対 列のプロトコル」の相性残差（パーセントポイント）です。実測の対面勝率から、強度モデルが予想する勝率を引いた値で、0 が「強さ通り」を意味します。\n正（緑）は個々の強さから期待されるより行側が有利＝カウンター、負（赤）は不利＝苦手です。\n実測勝率そのものではなく「強さで説明できない上振れ/下振れ」を表すので、強いプロトコルでも得意・不得意が見えます。実測勝率の相性表は下の旧表示の折りたたみに残してあります。",
  "statsDashboard.matrixOld": "旧表示（実測勝率の相性表・ペア一覧）",
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
  "stat.wilsonExplain":
    "各行は左から 順位、組み合わせ名、試合数、勝率バー、右端に勝率% です。バーは勝率の95%信頼区間（横線）と点推定（丸）で、中央の縦線が50%です。試合数が少ないほどバー（区間）は広がります。\n\n並べ替えは勝率ではなく Wilson 下限（信頼区間の下端）で行います。試合数が少ないと勝率は偶然で大きく振れるため、「本当の勝率はこの値より上だと95%確信できる」控えめな下限で評価し、少数試合のまぐれ上位を防ぎます。\n\nWilson 下限の式（p̂=勝率, n=試合数, z=1.96）:\n　下限 = ( p̂ + z²/2n − z·√( p̂(1−p̂)/n + z²/4n² ) ) / ( 1 + z²/n )",
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

  // Strength (Bradley-Terry θ / β)
  "strength.title": "プロトコル強度（交絡を外した推定）",
  "strength.firstAdvantage":
    "先攻有利: 五分のデッキ同士なら先攻が {rate}% 勝つ（β={beta}）",
  "strength.note":
    "{games} 試合から推定。データが少ないほど 0（五分）へ縮小されます。",
  "strength.row": "{n}: 強度 θ={theta}",
  "strength.explain":
    "θ（シータ）は各プロトコルの強度です。ただし勝率ではなく「ロジット（対数オッズ）」スケールの値で、0 が平均的な強さ、正なら強い・負なら弱いことを表します。0.3 のような数値は勝率% ではありません。\n\nこれは Bradley-Terry 型のモデルで、全試合をまとめてロジスティック回帰で解いて求めます。先攻3枚と後攻3枚が戦うときの予測勝率は\n　P(先攻が勝つ) = σ( β + (θ先1+θ先2+θ先3) − (θ後1+θ後2+θ後3) ),　σ(x)=1/(1+e^−x)\nσ はロジスティック関数です。両チームのθ合計の差が大きいほど勝率が偏ります。\n\nθ差→勝率の目安（他が同じとき）: θ を 0.3 上げると勝率は σ(0.3)≒57%、1.0 上げると σ(1.0)≒73%。単体勝率と違い、相方・相手の強さの影響（交絡）を差し引いた純粋な貢献度です。\n\nβ（ベータ）は先攻そのものの有利さ（同じくロジットスケール）で、五分のデッキ同士なら先攻の勝率が σ(β) になります。データが少ないほど θ・β は 0（平均）へ控えめに縮小されます。",

  // Synergy (ペアシナジー残差)
  "synergy.title": "ペアシナジー（実測 − モデル期待）",
  "synergy.note": "残差(緑+)＝個々の強さ以上に噛み合う、(赤−)＝噛み合わない。",
  "synergy.row":
    "{n}: 残差 {residual}pp（実測 {actual}% / 期待 {expected}%、{g}戦）",
  "synergy.explain":
    "ペアシナジーは2枚の噛み合いを残差で測ります。\n　残差 = 実測勝率 − モデル期待勝率（パーセントポイント）\nモデル期待勝率は、そのペアを含む各試合の予測勝率 σ( ±β + Σθ_自 − Σθ_相手 ) を平均したものです（強度θだけで決まる勝率）。\n\n正（緑）なら個々の強さから期待される以上に噛み合っている、負（赤）なら足を引っ張り合っているペアです。単なるペア勝率と違い「強いプロトコル同士だから勝てている分」を取り除いてあるので、本当の相乗効果が見えます。",

  // Archetype (共起クラスタ)
  "archetype.title": "アーキタイプ相性",
  "archetype.note":
    "一緒に握られるプロトコルの共起からデッキ類型を抽出。セルは行のアーキタイプが勝つ側。",
  "archetype.explain":
    "アーキタイプは「一緒に握られやすいプロトコルのまとまり」をデッキ類型として自動抽出したものです（共起のクラスタリング）。凡例の A1, A2… が各類型で、構成プロトコルを略号で示します。\n表のセルは「行の類型 対 列の類型」の勝率で、行側が勝つ割合です。緑が行の得意、赤が苦手、– はデータ不足です。\n個々のプロトコルではなく「デッキの型同士」の有利不利をざっくり掴むための表です。",

  // Quadrant (散布図)
  "quadrant.title": "ピック率 vs 勝率 散布図",
  "quadrant.scopeLabel": "対象:",
  "quadrant.xAxis": "ピック率 (%)",
  "quadrant.yAxis": "勝率 (%)",
  "quadrant.svgAriaLabel": "{title} 散布図",
  "quadrant.tableCaption": "{title} データ表",
  "quadrant.tableProtocol": "プロトコル",
  "quadrant.tablePickRate": "ピック率 (%)",
  "quadrant.tableWinRate": "勝率 (%)",
  "quadrant.tableGames": "試合数",

  // UsageTimeline (週別ピック率折れ線グラフ)
  "usage.title": "週別ピック率推移",
  "usage.xAxis": "週",
  "usage.yAxis": "ピック率 (%)",
  "usage.svgAriaLabel": "{title} 折れ線グラフ",
  "usage.tableCaption": "{title} データ表",
  "usage.tableBucket": "週",
} as const;

export type TranslationKey = keyof typeof ja;

/** 全キーを必須に持つ辞書型。各言語ファイルはこの型で網羅性を保証する。 */
export type TranslationDict = Record<TranslationKey, string>;
