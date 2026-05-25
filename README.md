# compile-battle-stats

カードゲーム「コンパイル」の対戦結果を記録・集計するWebアプリです。

## 概要

プロトコルを3つ選んで戦う「コンパイル」の対戦データを管理し、勝率・相性などの統計を可視化します。Firebaseが設定されていない場合はローカルストレージのみで動作するため、Firebase不要でローカル開発が可能です。

## 機能

- 対戦結果の記録（先攻・後攻それぞれのプロトコル3種と勝者）
- レシオバトル（両者のレシオ合計が上限以下の対戦）の自動判定
  - レシオ制はコミュニティで考案されたルールです。
  - 各プロトコルの強さに応じて数字（レシオ）を割り振り、その合計が8以下になるようにドラフトするというルールです。
  - 詳しくは[compile レシオ制の調整内容(season3)](https://note.com/purple_ztmy/n/n7939f19dbdec)などを御覧ください。
  - `ratioProtocols` でシーズンごとにレシオ対戦へ参加できるプロトコルを制御しています。V2プロトコルは現在レシオ対象外です。
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

| シーズン | プロトコルセット | レシオ対象 | 書き込み |
|---------|--------------|----------|--------|
| Season 3 | V2（24種） | V1_AUX（15種） | 可 |
| Season 2 | V2（24種） | V1_AUX（15種） | 不可 |
| Season 1 (Aux) | V1_AUX（15種） | V1_AUX（15種） | 不可 |
| Season 1 | V1（12種） | V1（12種） | 不可 |

新しいシーズンを追加するには `src/config.ts` の `SEASONS_CONFIG` にエントリを追加してください。主要なフィールドは以下の通りです。

| フィールド | 説明 |
|-----------|-----|
| `protocolVer` | 使用するプロトコルセット（`PROTOCOL_SETS` のキー） |
| `ratioVer` | レシオ値セット（`RATIO_SETS` のキー） |
| `ratioProtocols` | レシオ対戦に参加できるプロトコルの一覧（`PROTOCOL_SETS` の値） |
| `maxRatio` | レシオ上限値 |
| `isReadOnly` | 書き込み禁止フラグ |

## 技術スタック

- **フロントエンド**: React 19 + TypeScript 6
- **ビルド**: Vite 8
- **スタイリング**: Tailwind CSS v4
- **データベース**: Firebase Firestore（オプション）/ localStorage（フォールバック）
- **テスト**: Vitest
- **Linter / Formatter**: Biome
