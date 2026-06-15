# Changelog

## [2.5.2](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.5.1...compile-battle-stats-v2.5.2) (2026-06-15)


### Bug Fixes

* ratio推奨トリオをレシオ戦専用モデルに切り替える ([#247](https://github.com/fenril058/compile-battle-stats/issues/247)) ([16b5d5d](https://github.com/fenril058/compile-battle-stats/commit/16b5d5d425196f576dd5457e78cc34caac602858))
* 出場数不足プロトコルを推奨トリオ候補から除外する ([#248](https://github.com/fenril058/compile-battle-stats/issues/248)) ([eef0880](https://github.com/fenril058/compile-battle-stats/commit/eef088006a3432a57b40ed58b57d3218865c534a))

## [2.5.1](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.5.0...compile-battle-stats-v2.5.1) (2026-06-14)


### Performance Improvements

* cache-nix-action で Nix ストアをキャッシュして CI を高速化する ([#237](https://github.com/fenril058/compile-battle-stats/issues/237)) ([83aa1d6](https://github.com/fenril058/compile-battle-stats/commit/83aa1d69736d5ff01a59eef14ba8a676e0b1274e))

## [2.5.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.4.0...compile-battle-stats-v2.5.0) (2026-06-12)


### Features

* θ の95%ブートストラップ区間を推定して強度表示に重ねる ([#229](https://github.com/fenril058/compile-battle-stats/issues/229)) ([aea255f](https://github.com/fenril058/compile-battle-stats/commit/aea255faeae4edee10081c26ca5bb57abb7ce055))
* 戦績一覧にプロトコル・種別・対戦日のフィルタを追加する ([#228](https://github.com/fenril058/compile-battle-stats/issues/228)) ([f1ab470](https://github.com/fenril058/compile-battle-stats/commit/f1ab470b27679685be6f2f6138ed0f62d417647c))


### Performance Improvements

* local モードでは firebase チャンクを読み込まない（遅延初期化） ([#230](https://github.com/fenril058/compile-battle-stats/issues/230)) ([ca58651](https://github.com/fenril058/compile-battle-stats/commit/ca58651df7b1ab1dbf681077eac75c8d366e2a05))

## [2.4.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.3.0...compile-battle-stats-v2.4.0) (2026-06-11)


### Features

* CSV インポートをプレビュー→確定の2段階フローにする ([#226](https://github.com/fenril058/compile-battle-stats/issues/226)) ([056b396](https://github.com/fenril058/compile-battle-stats/commit/056b396128791fba9da0d65c315bbbb26e16312b))
* usageTimeline の空週を欠測(null)として補完し時系列の間隔を正しくする ([#224](https://github.com/fenril058/compile-battle-stats/issues/224)) ([cf37a71](https://github.com/fenril058/compile-battle-stats/commit/cf37a71cc8d94170231d35f6fc93056a16e5a596))
* フック内のトーストと confirm 文言を i18n 化する ([#221](https://github.com/fenril058/compile-battle-stats/issues/221)) ([27295bf](https://github.com/fenril058/compile-battle-stats/commit/27295bfde9d664a8702d6fcbb091e8ef41628961))
* 先攻補正 β を通常戦/レシオ戦で分離推定して表示する ([#225](https://github.com/fenril058/compile-battle-stats/issues/225)) ([bc82a4e](https://github.com/fenril058/compile-battle-stats/commit/bc82a4e569865b7f44773ddc6f9cadfc64aed37d))
* 散布図の高さを点数に応じて動的化しラベルの上端はみ出しを防ぐ ([#220](https://github.com/fenril058/compile-battle-stats/issues/220)) ([7ca589b](https://github.com/fenril058/compile-battle-stats/commit/7ca589b842b56e2eaf2b0a285eb83f14d5ae8695))


### Bug Fixes

* DataToolbar の CSV 形式説明を i18n 化する ([#207](https://github.com/fenril058/compile-battle-stats/issues/207)) ([48be219](https://github.com/fenril058/compile-battle-stats/commit/48be219d4adcc7287fbaa697a832ee024d29d45e))
* onSnapshot の serverTimestamp pending 中も createdAt を推定値で受ける ([#205](https://github.com/fenril058/compile-battle-stats/issues/205)) ([c9d0fc2](https://github.com/fenril058/compile-battle-stats/commit/c9d0fc2d3125c0e2defa95a3a2077e8c0706ecb8))
* remote 未ログイン時の CSV インポートをログイン要求トーストで中断する ([#206](https://github.com/fenril058/compile-battle-stats/issues/206)) ([b896be2](https://github.com/fenril058/compile-battle-stats/commit/b896be286f39bafcbc3fb84cc569d65182d1a42b))
* レシオ相性表の軸をシーズン設定の ratioProtocols から導出する ([#223](https://github.com/fenril058/compile-battle-stats/issues/223)) ([d85aea3](https://github.com/fenril058/compile-battle-stats/commit/d85aea33cc683fd7255bb010dd3249caf8e9e7d5))
* 件数減少時に MatchList の現在ページをクランプして空ページ表示を防ぐ ([#204](https://github.com/fenril058/compile-battle-stats/issues/204)) ([13f3ce6](https://github.com/fenril058/compile-battle-stats/commit/13f3ce6cb4368c67e97782e4e5331c1dc2007c44))

## [2.3.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.2.1...compile-battle-stats-v2.3.0) (2026-06-09)


### Features

* Firestore を所有者ベースの書き込み制御にする ([#187](https://github.com/fenril058/compile-battle-stats/issues/187)) ([#188](https://github.com/fenril058/compile-battle-stats/issues/188)) ([64187c0](https://github.com/fenril058/compile-battle-stats/commit/64187c0a8fcacba7b55f0b082b7642d69bdc90fa))

## [2.2.1](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.2.0...compile-battle-stats-v2.2.1) (2026-06-07)


### Bug Fixes

* アーキタイプ相性の対角セル（A1 vs A1）を常に null にする ([#167](https://github.com/fenril058/compile-battle-stats/issues/167)) ([d56cb37](https://github.com/fenril058/compile-battle-stats/commit/d56cb3700d11e4d990c80cd19d0ef190ad4793d0))

## [2.2.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.1.1...compile-battle-stats-v2.2.0) (2026-06-05)


### Features

* **ui:** 2枚組・3枚組ランキングに最小試合数スライダーを追加する ([#162](https://github.com/fenril058/compile-battle-stats/issues/162)) ([82833d3](https://github.com/fenril058/compile-battle-stats/commit/82833d38b7bf27ecaef889e6fe9595ee31031a8f))
* **ui:** forest plot 列ヘッダ・ロジット定義・散布図メタ情報を追加 ([#142](https://github.com/fenril058/compile-battle-stats/issues/142)) ([d7096ce](https://github.com/fenril058/compile-battle-stats/commit/d7096ce74820f8237326532f6c58437c11732124))
* **ui:** ダッシュボードにセクション内ナビゲーションを追加する ([#156](https://github.com/fenril058/compile-battle-stats/issues/156)) ([3a47cfc](https://github.com/fenril058/compile-battle-stats/commit/3a47cfc1c7714b71200280c78d782362103e9a14))
* **ui:** 残差マトリクスのセル配色を連続グラデーション化する ([#157](https://github.com/fenril058/compile-battle-stats/issues/157)) ([0d051ad](https://github.com/fenril058/compile-battle-stats/commit/0d051ad01602c42d842782919e1a36a3b15f8fa7))


### Bug Fixes

* **i18n:** strength.title の θ を en にも追加し散布図総試合数テストを追加 ([#144](https://github.com/fenril058/compile-battle-stats/issues/144)) ([b474ceb](https://github.com/fenril058/compile-battle-stats/commit/b474ceb0791d0116fc81c63af2f5a15206f079c3))
* **ui:** forest plot の pair/trio 試合数下限を撤廃 ([#152](https://github.com/fenril058/compile-battle-stats/issues/152)) ([7caced0](https://github.com/fenril058/compile-battle-stats/commit/7caced0a1e7f3a6d5ff8e971284395c49d7f88d9))
* **ui:** Synergyの表示件数を上位/下位N件に制限し中位をdetailsに折りたたむ ([#153](https://github.com/fenril058/compile-battle-stats/issues/153)) ([b5e4b7e](https://github.com/fenril058/compile-battle-stats/commit/b5e4b7ec0d31d288e140a969f545cae8b112c542))
* **ui:** マトリクス左上「PRO」隅セルの意味を分かりやすくする ([#158](https://github.com/fenril058/compile-battle-stats/issues/158)) ([df4edd3](https://github.com/fenril058/compile-battle-stats/commit/df4edd3a1095dc050dec1bdbe4b8a0020bd2bd38))
* **ui:** 散布図のラベルを各点の真横に固定し引き出し線を短縮する ([#161](https://github.com/fenril058/compile-battle-stats/issues/161)) ([bce13af](https://github.com/fenril058/compile-battle-stats/commit/bce13af43a944a82b30c8a6a082acb6c1710326d))
* **ui:** 散布図の密集クラスタでラベル引き出し線終点を縦一列へ整列 ([#147](https://github.com/fenril058/compile-battle-stats/issues/147)) ([#155](https://github.com/fenril058/compile-battle-stats/issues/155)) ([93eb718](https://github.com/fenril058/compile-battle-stats/commit/93eb7189de4eb3a6ef788553d942571357f74213))
* **ui:** 残差マトリクスの既定表示を「出現のみ」にして空カラムを抑制する ([#154](https://github.com/fenril058/compile-battle-stats/issues/154)) ([c20e5d2](https://github.com/fenril058/compile-battle-stats/commit/c20e5d276f99f3a5692dba245a50dcf72c2ac858))

## [2.1.1](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.1.0...compile-battle-stats-v2.1.1) (2026-06-05)


### Bug Fixes

* **ui:** 推移グラフの縦軸を 5% 程度の細かい刻みにする ([#139](https://github.com/fenril058/compile-battle-stats/issues/139)) ([eda7f1e](https://github.com/fenril058/compile-battle-stats/commit/eda7f1e803601916b5a60d58c09b0c8c44715506))

## [2.1.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v2.0.0...compile-battle-stats-v2.1.0) (2026-06-04)


### Features

* Bradley-Terry 型回帰でプロトコル強度θと先攻補正βを推定する ([#108](https://github.com/fenril058/compile-battle-stats/issues/108)) ([60f4b3e](https://github.com/fenril058/compile-battle-stats/commit/60f4b3ea501abbc8eead274c4cf7796823658aa2))
* rows() の各統計行に Wilson 信頼区間 (low/high) を付与する ([#100](https://github.com/fenril058/compile-battle-stats/issues/100)) ([72b61d6](https://github.com/fenril058/compile-battle-stats/commit/72b61d6f7a76e505f37f67d6438fada61e53f609))
* **ui:** 各分析ブロックに折りたたみ解説を追加 ([#127](https://github.com/fenril058/compile-battle-stats/issues/127)) ([f21b0e7](https://github.com/fenril058/compile-battle-stats/commit/f21b0e70e1e2b8153a1a08c12d69366bf2790d66))
* **ui:** 推移グラフから「その他」系列を削除 ([#131](https://github.com/fenril058/compile-battle-stats/issues/131)) ([d53f46f](https://github.com/fenril058/compile-battle-stats/commit/d53f46fb5ef3c488cccdd8a294bff84198acdf7e))
* **ui:** 散布図に 全体/通常戦/レシオ の対象トグルを追加 ([#129](https://github.com/fenril058/compile-battle-stats/issues/129)) ([ea297a0](https://github.com/fenril058/compile-battle-stats/commit/ea297a080cb393a85ef0ab7e9d9b2b82162111dc))
* **ui:** 相性残差表の行ヘッダにプロトコル強度θを併記 ([#137](https://github.com/fenril058/compile-battle-stats/issues/137)) ([eb38e84](https://github.com/fenril058/compile-battle-stats/commit/eb38e84af9ca71cf0b7b889387ce148b83e43d1f))
* **ui:** 解説を数式付きで拡充（forest plot 列の意味 / 強度θ・Bradley-Terry / シナジー） ([#133](https://github.com/fenril058/compile-battle-stats/issues/133)) ([00ccb39](https://github.com/fenril058/compile-battle-stats/commit/00ccb39d11f124ae1bfada45f7e2224086832ac2))
* アーキタイプ一覧と相性ヒートマップを可視化する ([#122](https://github.com/fenril058/compile-battle-stats/issues/122)) ([5bf7ce2](https://github.com/fenril058/compile-battle-stats/commit/5bf7ce2c07803bfff65ff8f6e765ec7657ef7f5b))
* ピック率×勝率の散布図(4象限)でメタを俯瞰できるようにする ([#104](https://github.com/fenril058/compile-battle-stats/issues/104)) ([53dc6d2](https://github.com/fenril058/compile-battle-stats/commit/53dc6d2bc70db72e34423b66d314a90b6326e5f3))
* プロトコル使用率の週別時系列(折れ線)でメタの変遷を可視化する ([#114](https://github.com/fenril058/compile-battle-stats/issues/114)) ([2aeaa58](https://github.com/fenril058/compile-battle-stats/commit/2aeaa58248ffa1be3727a0d306a9ab5670d6ed0d))
* プロトコル強度θと先攻補正βを可視化する Strength セクションを追加する ([#110](https://github.com/fenril058/compile-battle-stats/issues/110)) ([932117d](https://github.com/fenril058/compile-battle-stats/commit/932117d45cf5e2f3d55315e9943272cf795cd316))
* 共起クラスタリングでアーキタイプを抽出しアーキタイプ相性表の土台を作る ([#120](https://github.com/fenril058/compile-battle-stats/issues/120)) ([bb04344](https://github.com/fenril058/compile-battle-stats/commit/bb043449245b1fd8bd9c1b15c5ada3399425823e))
* 勝率の Wilson 信頼区間ヘルパーを logic.ts に追加する ([#97](https://github.com/fenril058/compile-battle-stats/issues/97)) ([2dd9ead](https://github.com/fenril058/compile-battle-stats/commit/2dd9eadd6a55b4675d21027540aacad13238bc7f))
* 勝率ランキングを forest plot 化し Wilson 下限ソート＋旧表を折りたたみ保存する ([#103](https://github.com/fenril058/compile-battle-stats/issues/103)) ([3a3f332](https://github.com/fenril058/compile-battle-stats/commit/3a3f33236d2db2ddec8b3e93ab635b016d4947bb))
* 相性表をモデル残差ヒートマップ化し実測勝率表を折りたたみ保存する ([#116](https://github.com/fenril058/compile-battle-stats/issues/116)) ([044ac5d](https://github.com/fenril058/compile-battle-stats/commit/044ac5d22b4affbf53c4811174d038582c7870be))


### Bug Fixes

* **ui:** forest plot のペア/トリオ名の見切れ解消とPCでのチャート拡大 ([#124](https://github.com/fenril058/compile-battle-stats/issues/124)) ([689a75d](https://github.com/fenril058/compile-battle-stats/commit/689a75d080e3aa902e2a4196d259ab7a1cb02343))

## [2.0.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.8.1...compile-battle-stats-v2.0.0) (2026-06-03)


### Features

* i18n 基盤を導入し UI の日本語/英語切替を追加する ([#87](https://github.com/fenril058/compile-battle-stats/issues/87)) ([f51a0f5](https://github.com/fenril058/compile-battle-stats/commit/f51a0f5a7cb905f2435120a10e8cc0ee4ad509db))
* UI 全体を i18n 化し英語版 README を追加して ver 2.0 とする ([#93](https://github.com/fenril058/compile-battle-stats/issues/93)) ([f776d95](https://github.com/fenril058/compile-battle-stats/commit/f776d959d0ba18394f742c8cd49a1c0e00c45cb9))

## [1.8.1](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.8.0...compile-battle-stats-v1.8.1) (2026-06-02)


### Bug Fixes

* axe-core を e2e に組み込み contrast/focus 違反を修正する ([#81](https://github.com/fenril058/compile-battle-stats/issues/81)) ([ef97eb4](https://github.com/fenril058/compile-battle-stats/commit/ef97eb4daaa65d6bcae43a0d3508cf6e64101d09))
* スクリーンリーダー/キーボード操作のアクセシビリティを改善する ([#83](https://github.com/fenril058/compile-battle-stats/issues/83)) ([96c078a](https://github.com/fenril058/compile-battle-stats/commit/96c078acf57334bc4116d333fcbbf1cd3f48358d))
* 不正なシーズンキーでクラッシュする問題と白画面問題を修正する ([#79](https://github.com/fenril058/compile-battle-stats/issues/79)) ([2a79a59](https://github.com/fenril058/compile-battle-stats/commit/2a79a59b0277ea6c66a7bb49f46bed4dffbe8125))
* 対戦日(matchDate)を UTC 正準の暦日として統一する ([#69](https://github.com/fenril058/compile-battle-stats/issues/69)) ([d69b1e8](https://github.com/fenril058/compile-battle-stats/commit/d69b1e8269e072af2df667cc3a01192d55baec93))
* 統計の妥当性判定を makeStats と相性表で統一する ([#67](https://github.com/fenril058/compile-battle-stats/issues/67)) ([09a3251](https://github.com/fenril058/compile-battle-stats/commit/09a3251c43364c43b89853203e96fcb5506cdfd0))

## [1.8.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.7.1...compile-battle-stats-v1.8.0) (2026-06-01)


### Features

* 統計/相性表の表示を改善（[#45](https://github.com/fenril058/compile-battle-stats/issues/45)） ([1c65930](https://github.com/fenril058/compile-battle-stats/commit/1c65930255ded40b7c8e73a2728892fc5b57225a))


### Bug Fixes

* CSV インポート失敗トーストを1件の集計通知に集約する ([#42](https://github.com/fenril058/compile-battle-stats/issues/42)) ([fa60949](https://github.com/fenril058/compile-battle-stats/commit/fa60949599bae4edd29d7f5131a3493a49988c6d))

## [1.7.1](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.7.0...compile-battle-stats-v1.7.1) (2026-05-31)


### Bug Fixes

* シーズン選択ドロップダウンが displayName を表示するように修正 ([#43](https://github.com/fenril058/compile-battle-stats/issues/43)) ([eca4de1](https://github.com/fenril058/compile-battle-stats/commit/eca4de12cef62a12698d5fb794e58a013dff7920))

## [1.7.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.6.0...compile-battle-stats-v1.7.0) (2026-05-31)


### Features

* local ハーネスをログイン不要で登録可能にする（[#48](https://github.com/fenril058/compile-battle-stats/issues/48) B 案 step3） ([dc200ac](https://github.com/fenril058/compile-battle-stats/commit/dc200acdb3e79e43425987c250a26c3cb6081e77))
* アクセシビリティ補強（table caption/scope、tablist ARIA、skip link） ([#47](https://github.com/fenril058/compile-battle-stats/issues/47)) ([c195381](https://github.com/fenril058/compile-battle-stats/commit/c195381780cd7489350b7709327c9db8c60e6127))
* ストレージ契約 StorageAdapter と LocalAdapter を追加（[#48](https://github.com/fenril058/compile-battle-stats/issues/48) B 案 step1） ([378075f](https://github.com/fenril058/compile-battle-stats/commit/378075fc0168c08f6f686c94a9d97b899a9d4917))


### Bug Fixes

* CSV エクスポート・インポート往路対応（クオート除去・MIME改善・登録日時尊重） ([#41](https://github.com/fenril058/compile-battle-stats/issues/41)) ([c26c37f](https://github.com/fenril058/compile-battle-stats/commit/c26c37f7b68d2d97efd16cde99690a0a115fba72))
* Matrix 描画で DOM ネスト違反の console.error を解決 ([#44](https://github.com/fenril058/compile-battle-stats/issues/44)) ([23b92c0](https://github.com/fenril058/compile-battle-stats/commit/23b92c0036d145eb9cdbb7fac6660c187156e1b6))
* typo・年号・hover 色・二重スキームなど細かな修正 ([#46](https://github.com/fenril058/compile-battle-stats/issues/46)) ([d78be36](https://github.com/fenril058/compile-battle-stats/commit/d78be36a60a3066fa426ac6aa36fe458e19890a4))
* タブを WAI-ARIA タブパターンに準拠（tabpanel 関連付け・roving tabindex） ([644218d](https://github.com/fenril058/compile-battle-stats/commit/644218d37c4fcbdb32757e1afc091d63ae3ff18d))
* 矢印キーのタブ操作でフォーカスが追従しない問題を修正 ([b6ddc06](https://github.com/fenril058/compile-battle-stats/commit/b6ddc06524f957ccb547a4fd813c24ed6733a5d9)), closes [#47](https://github.com/fenril058/compile-battle-stats/issues/47)

## [1.6.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.5.0...compile-battle-stats-v1.6.0) (2026-05-29)


### Features

* CSVエクスポートにレシオ表をコメントとして埋め込む ([2b0dcac](https://github.com/fenril058/compile-battle-stats/commit/2b0dcacef4b7b097a4bded846830414898add288))

## [1.5.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.4.0...compile-battle-stats-v1.5.0) (2026-05-28)


### Features

* **ui:** Protocol選択セレクトボックスにoptgroupでMain/Aux区切りを追加 ([b72f3d4](https://github.com/fenril058/compile-battle-stats/commit/b72f3d48f37a739a907abc0826bb97dbcaf02708)), closes [#32](https://github.com/fenril058/compile-battle-stats/issues/32)
* **ui:** Protocol選択をグループ付き検索可能コンボボックスに変更 (closes [#32](https://github.com/fenril058/compile-battle-stats/issues/32)) ([305addd](https://github.com/fenril058/compile-battle-stats/commit/305adddc38df5a8de53fb8048974576c4a373709))
* **ui:** react-selectで検索可能なProtocolコンボボックスを実装 ([e9146bd](https://github.com/fenril058/compile-battle-stats/commit/e9146bde74ab88a3e6e6acb932c5bec64fa5c45b))


### Bug Fixes

* **assets:** Update favicon link in index.html ([9016a9e](https://github.com/fenril058/compile-battle-stats/commit/9016a9e14d4b95611ee39e1166e3c972fddd4ccf)), closes [#33](https://github.com/fenril058/compile-battle-stats/issues/33)

## [1.4.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.3.0...compile-battle-stats-v1.4.0) (2026-05-25)


### Features

* apply modern web improvements via modern-web-guidance skill ([79b442f](https://github.com/fenril058/compile-battle-stats/commit/79b442f8579ba321b8fccf9b1eb26c4a431e573c))


### Bug Fixes

* hide protocols without ratio values from RatioTable ([b821f5e](https://github.com/fenril058/compile-battle-stats/commit/b821f5e48e8fd5547433f5a9e095f660e3e36796))

## [1.3.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.2.0...compile-battle-stats-v1.3.0) (2026-05-20)


### Features

* enable Firebase Analytics ([4702407](https://github.com/fenril058/compile-battle-stats/commit/4702407f4251a74ebc1e33fe61c7b6bae921095d))

## [1.2.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.1.0...compile-battle-stats-v1.2.0) (2026-05-17)


### Features

* add protocol filter tabs to ranking section ([86894fe](https://github.com/fenril058/compile-battle-stats/commit/86894fe20d306b11a90096758246b9e262d31cd8))

## [1.1.0](https://github.com/fenril058/compile-battle-stats/compare/compile-battle-stats-v1.0.2...compile-battle-stats-v1.1.0) (2026-05-15)


### Features

* add ci.yml and change dependabot setting ([899cbd1](https://github.com/fenril058/compile-battle-stats/commit/899cbd1bb4dc9b6769838a8355e5a977812bf754))
* Matrix を4種のプロトコルグループ別フィルタに変更 ([a0f2338](https://github.com/fenril058/compile-battle-stats/commit/a0f2338cf0b50aa5dcd058e4fbaf3e8a47e4102b))
* Stat に各カード独立タブ、Matrix をタブ切り替え式UIに変更 ([e3fe9fa](https://github.com/fenril058/compile-battle-stats/commit/e3fe9fa3a99a783264c7e1a418d05c1c966bf8ef))
* UIをタブ切り替え式に改善し、Matrix をプロトコルグループ別表示に変更 ([48701ce](https://github.com/fenril058/compile-battle-stats/commit/48701ce948b7c5313a391242451fcfd9421ab349))


### Bug Fixes

* ad blockerによる削除ボタン・Googleログイン不具合を修正 ([12619c4](https://github.com/fenril058/compile-battle-stats/commit/12619c4965217af907e2cb2d4ce8bd04cea25f70))
* nodejs version ([08bdb49](https://github.com/fenril058/compile-battle-stats/commit/08bdb499894e854526afa27095c00768eea9b405))
* remove unsupported semver cooldown fields for github-actions and nix ([f2b0b9e](https://github.com/fenril058/compile-battle-stats/commit/f2b0b9ec542f52a6db8824c33bd476865d88a06c))
* Stats の先攻/後攻タブ表記を MatchForm と統一 ([07bae55](https://github.com/fenril058/compile-battle-stats/commit/07bae5588fab2d44a23c428b92863f26772342d8))
* レシオ相性表のプロトコル表示を V1_AUX に限定 ([4de9f44](https://github.com/fenril058/compile-battle-stats/commit/4de9f446f05a456cb71a2914ab770f9a3476d870))
