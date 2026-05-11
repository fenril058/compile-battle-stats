# compile-battle-stats

コンパイルバトルの対戦結果を記録・集計するWebアプリです。

## 概要

プロトコルを3つ選んで戦う「コンパイルバトル」の対戦データを管理し、勝率・相性などの統計を可視化します。Firebaseが設定されていない場合はローカルストレージのみで動作するため、Firebase不要でローカル開発が可能です。

## 機能

- 対戦結果の記録（先攻・後攻それぞれのプロトコル3種と勝者）
- レシオバトル（両者のレシオ合計が上限以下の対戦）の自動判定
- シーズンごとの統計表示
  - プロトコル単体 / 2種組み合わせ / 3種組み合わせの勝率
  - 先攻・後攻別の勝率
  - プロトコル間のマッチアップ行列
- Firebase（Firestore）によるリモート共有 / ローカルストレージによるオフライン動作

## セットアップ

```bash
npm install
```

Firebase を使う場合は `.env.example` を `.env` にコピーして Firebase の認証情報を入力してください。`.env` がない、または空の場合はローカルストレージモードで動作します。

```bash
cp .env.example .env
# .env を編集して Firebase の認証情報を記入
```

## 開発

```bash
npm run dev       # 開発サーバー起動
npm run build     # 型チェック + ビルド
npm run check:fix # Biome によるフォーマット・Lint の自動修正
npm run test      # テスト実行
```

## シーズン

| シーズン | プロトコルセット | 書き込み |
|---------|--------------|--------|
| Season 3 | V2 (メイン24種) | 可 |
| Season 2 | V2 (メイン24種) | 不可 |
| Season 1 (Aux) | V1_AUX (メイン12種 + 補助3種) | 不可 |
| Season 1 | V1 (メイン12種) | 不可 |

新しいシーズンを追加するには `src/config.ts` の `SEASONS_CONFIG` にエントリを追加してください。

## 技術スタック

- **フロントエンド**: React + TypeScript
- **ビルド**: Vite 8
- **スタイリング**: Tailwind CSS v4
- **データベース**: Firebase Firestore（オプション）/ localStorage（フォールバック）
- **テスト**: Vitest
- **Linter / Formatter**: Biome
