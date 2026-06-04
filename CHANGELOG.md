# Changelog

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
