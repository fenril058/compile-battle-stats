/**
 * 英語辞書。`TranslationDict` 注釈により `ja.ts` の全キー網羅を強制する
 * （キーが欠ければ `tsc --noEmit` が失敗する）。
 */
import type { TranslationDict } from "./ja";

export const en: TranslationDict = {
  // App shell
  "app.documentTitle":
    "Compile Battle Stats Tracker | Win-rate stats for the board game Compile",
  "app.skipToMain": "Skip to main content",

  // Common terms
  "common.first": "First",
  "common.second": "Second",
  "common.ratio": "Ratio",
  "common.noData": "No data",
  "common.explainer": "How to read this",

  // Header
  "header.seasonSelect": "Season",
  "header.languageSelect": "Language",
  "header.logout": "Log out",
  "header.loginWithGoogle": "Sign in with Google",

  // MatchForm
  "matchForm.title": "Record a match",
  "matchForm.matchDate": "Match date (optional)",
  "matchForm.swap": "🔄 Swap",
  "matchForm.firstWin": "First WIN",
  "matchForm.secondWin": "Second WIN",
  "matchForm.reloadLocal": "Reload local",
  "matchForm.registrationClosed": "Registration period has ended",
  "matchForm.ratioSum": "Ratio: {sum}",
  "matchForm.firstSlotAria": "First side, selection {n}",
  "matchForm.secondSlotAria": "Second side, selection {n}",
  "matchForm.toast.loginRequired": "Sign-in required",
  "matchForm.toast.seasonNotAllowed":
    "Registration is not allowed for this season.",
  "matchForm.toast.invalidProtocols": "Protocols are not selected correctly.",
  "matchForm.toast.cancelledFixInput":
    "Match registration cancelled. Please fix your input.",
  "matchForm.toast.cancelledInterTeam":
    "Match registration cancelled. (Please fix the cross-team duplication.)",
  "matchForm.confirm.intraTeam":
    "[Important] There are duplicate protocols within a team. This match will be excluded from stats calculations. Register anyway?\n\n[OK]: Continue\n[Cancel]: Fix input",
  "matchForm.confirm.interTeam":
    "Warning: protocols overlap between the first and second side (e.g. A, B, C vs C, D, E). This match will be counted in stats, but please confirm it is intended.\n\n[OK]: Continue\n[Cancel]: Fix input",

  // MatchList
  "matchList.title": "Match List ({count})",
  "matchList.caption": "Match list",
  "matchList.header.registeredAt": "Registered",
  "matchList.header.winner": "Winner",
  "matchList.header.matchDate": "Match date",
  "matchList.empty": "No matches registered.",
  "matchList.pageSize": "Per page:",
  "matchList.paginationTop": "Pagination (top)",
  "matchList.paginationBottom": "Pagination (bottom)",
  "matchList.prevPage": "Previous page",
  "matchList.nextPage": "Next page",
  "matchList.pageStatus": "{current} / {total} pages",
  "matchList.delete": "Delete",
  "matchList.confirmDelete": "Confirm",
  "matchList.cancelDelete": "Back",

  // StatsDashboard
  "statsDashboard.statView": "Stats view",
  "statsDashboard.matrixView": "Matrix view",
  "statsDashboard.view.all": "All",
  "statsDashboard.view.main1": "Main1",
  "statsDashboard.view.main2": "Main2",
  "statsDashboard.view.mixed": "Mixed",
  "statsDashboard.matrix.ratio": "Ratio (Main1)",
  "statsDashboard.displayRange": "Range:",
  "statsDashboard.appearedOnly": "Appeared only",
  "statsDashboard.allProtocols": "All protocols",
  "statsDashboard.matrixEmpty": "No matches with {games}+ games yet.",
  "statsDashboard.pairListSummary": "Matchup pair list (experimental)",
  "statsDashboard.matrixTitle": "{name} matrix",
  "statsDashboard.residualTitle": "{name} matchup residual (actual − model)",
  "statsDashboard.residualNote":
    "Green (+) = more favorable than individual strength, red (−) = less. Deconfounded counters.",
  "statsDashboard.residualExplain":
    'Each number is the matchup residual (percentage points) of "row protocol vs column protocol." It\'s the actual head-to-head win rate minus the win rate the strength model predicts, so 0 means "exactly as strength would suggest."\nPositive (green) means the row side does better than its individual strength implies (a counter); negative (red) means worse (a bad matchup).\nBecause it shows the over/under-performance that strength can\'t explain — not the raw win rate — even strong protocols reveal their good and bad matchups. The raw win-rate matrix is kept in the old-view fold below.',
  "statsDashboard.matrixOld": "Old view (win-rate matrix & pair list)",
  "statsDashboard.stat.normal": "Normal",
  "statsDashboard.stat.combined": "Normal + Ratio",
  "statsDashboard.statTypeAria": "Stat type",

  // Stat
  "stat.tab.single": "Single",
  "stat.tab.pair": "Pair",
  "stat.tab.trio": "Trio",
  "stat.section.single": "Single-protocol win rate",
  "stat.section.pair": "Two-protocol win rate",
  "stat.section.trio": "Three-protocol win rate",
  "stat.section.first": "Win rate when going first",
  "stat.section.second": "Win rate when going second",
  "stat.minGames": "{label} ({games}+ games)",
  "stat.sortNote": "Sorted by Wilson lower bound (95% CI)",
  "stat.wilsonExplain":
    "Each row, left to right: rank, the protocol(s), game count, the win-rate bar, and the win rate % on the right. The bar shows the 95% confidence interval (horizontal line) and point estimate (dot); the center vertical line is 50%. Fewer games means a wider bar.\n\nSorting uses the Wilson lower bound (the interval's lower end), not the raw win rate. On few games a win rate swings by chance, so we rank by a conservative floor — \"we're 95% confident the true rate is above this\" — to keep small-sample flukes off the top.\n\nWilson lower bound (p̂ = win rate, n = games, z = 1.96):\n　lower = ( p̂ + z²/2n − z·√( p̂(1−p̂)/n + z²/4n² ) ) / ( 1 + z²/n )",
  "stat.oldTable": "Old view (table)",
  "stat.ci.aria": "{n}: win rate {p}%, 95% CI {low}–{high}%, {g} games",
  "stat.forest.games": "G",
  "stat.forest.ciLabel": "← Win rate (95% CI) →",
  "stat.slider.label": "Min. games",
  "stat.slider.games": "{n} games",
  "stat.slider.count": "({shown}/{total})",

  // Matrix
  "matrix.gamesHeading": "{title} ({games}+ games)",
  "matrix.cornerLabel": "→",

  // MatrixPairList
  "matrixPairList.empty": "No matchup pairs with {games}+ games yet",
  "matrixPairList.caption": "Matchup pair list ({games}+ games)",
  "matrixPairList.attacker": "Atk",
  "matrixPairList.defender": "Def",

  // RatioTable
  "ratioTable.title": "Ratio Table",
  "ratioTable.row": "{score} pts: {list}",

  // DataToolbar
  "dataToolbar.importLabel": "Import match data from CSV",
  "dataToolbar.selectFile": "Choose file",
  "dataToolbar.reimportNote":
    "* You can re-import a CSV file exported by this app",

  // ErrorBoundary
  "errorBoundary.title": "Something went wrong",
  "errorBoundary.description":
    "Reload the page, or clear localStorage and try again.",
  "errorBoundary.reload": "Reload",
  "errorBoundary.clearReload": "Clear localStorage and reload",

  // ProtocolSelect
  "protocolSelect.noOptions": "No matching protocols",

  // Strength (Bradley-Terry θ / β)
  "strength.title": "Protocol Strength θ (deconfounded)",
  "strength.firstAdvantage":
    "First-player edge: with even decks, first wins {rate}% (β={beta})",
  "strength.note":
    "Estimated from {games} matches. With less data, values shrink toward 0 (even).",
  "strength.logitNote":
    "θ and β use the logit (log-odds) scale = ln(p/(1−p)), not win-rate %",
  "strength.row": "{n}: strength θ={theta}",
  "strength.explain":
    "θ (theta) is each protocol's strength — but on a logit (log-odds) scale, not a win rate. 0 is average strength, positive is strong, negative is weak. A value like 0.3 is not a percentage.\n\nIt comes from a Bradley-Terry style model: all matches are solved jointly with logistic regression. The predicted win probability when three-vs-three decks meet is\n　P(first wins) = σ( β + (θf1+θf2+θf3) − (θs1+θs2+θs3) ),　σ(x)=1/(1+e^−x)\nwhere σ is the logistic function. The bigger the gap between the two teams' θ sums, the more lopsided the win rate.\n\nRough θ-gap → win rate (all else equal): raising θ by 0.3 gives σ(0.3)≈57%, by 1.0 gives σ(1.0)≈73%. Unlike a raw win rate, this is the pure contribution with partner/opponent strength (confounding) subtracted out.\n\nβ (beta) is the first-player advantage itself (also logit scale): with even decks the first player wins σ(β). With less data, θ and β shrink conservatively toward 0 (average).",

  // Synergy (pair residual vs model)
  "synergy.title": "Pair Synergy (actual − model)",
  "synergy.note":
    "Residual: green (+) = better together than individual strength, red (−) = worse.",
  "synergy.row":
    "{n}: residual {residual}pp (actual {actual}% / expected {expected}%, {g} games)",
  "synergy.explain":
    "Pair synergy measures how two protocols mesh, as a residual:\n　residual = actual win rate − model-expected win rate (percentage points)\nThe expected win rate averages each containing match's predicted σ( ±β + Σθ_self − Σθ_opp ) — the win rate explained by individual strength θ alone.\n\nPositive (green) means they mesh beyond their individual strength; negative (red) means they get in each other's way. Unlike a raw pair win rate, the \"two strong protocols winning anyway\" part is removed, revealing true synergy.",
  "synergy.more": "{count} more (middle tier, small residual)",

  // Archetype (co-occurrence clusters)
  "archetype.title": "Archetype Matchups",
  "archetype.note":
    "Deck types extracted from protocol co-occurrence. Cell = win rate of the row archetype.",
  "archetype.explain":
    'Archetypes are groups of protocols that tend to be drafted together, auto-extracted as deck types (co-occurrence clustering). The legend\'s A1, A2… are the types, shown with their member protocols abbreviated.\nEach cell is the win rate of "row type vs column type" — the share the row side wins. Green is good for the row, red is bad, and – means too little data.\nThis table is for a rough read on which deck types beat which, rather than individual protocols.',

  // Quadrant (scatter chart)
  "quadrant.title": "Pick Rate vs Win Rate",
  "quadrant.scopeLabel": "Scope:",
  "quadrant.xAxis": "Pick Rate (%)",
  "quadrant.yAxis": "Win Rate (%)",
  "quadrant.svgAriaLabel": "{title} scatter chart",
  "quadrant.tableCaption": "{title} data table",
  "quadrant.tableProtocol": "Protocol",
  "quadrant.tablePickRate": "Pick Rate (%)",
  "quadrant.tableWinRate": "Win Rate (%)",
  "quadrant.tableGames": "Games",
  "quadrant.totalGames": "n = {n} matches",
  "quadrant.sizeNote": "Dot size = pick count",

  // UsageTimeline (weekly pick-rate line chart)
  "usage.title": "Weekly Pick Rate Trends",
  "usage.xAxis": "Week",
  "usage.yAxis": "Pick Rate (%)",
  "usage.svgAriaLabel": "{title} line chart",
  "usage.tableCaption": "{title} data table",
  "usage.tableBucket": "Week",

  // SectionNav (in-page navigation)
  "nav.aria": "Section navigation",
  "nav.stat": "Stats",
  "nav.strength": "Strength",
  "nav.synergy": "Synergy",
  "nav.quadrant": "Scatter",
  "nav.usage": "Trends",
  "nav.matrix": "Matrix",
  "nav.archetype": "Archetypes",
};
