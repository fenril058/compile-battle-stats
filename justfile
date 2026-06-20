default:
    @just --list

# ==============================================================================
# 📦 依存関係管理 (Dependency Management)
# ==============================================================================

# npm audit (脆弱性検知でjustが異常終了しないよう行頭に `-` を付与)
[group('deps')]
audit:
    -npm audit

# 脆弱性を強制修正 (Nix環境対策で --ignore-scripts を付与)
[group('deps')]
audit-fix:
    npm audit fix --force --ignore-scripts

# npm install --package-lock-only (*args にして複数パッケージ対応 + Nix対策)
[group('deps')]
install *args:
    npm install {{args}} --package-lock-only --ignore-scripts

# npm install -D --package-lock-only
[group('deps')]
install-dev *args:
    npm install -D {{args}} --package-lock-only --ignore-scripts

# npm uninstall --package-lock-only
[group('deps')]
uninstall *args:
    npm uninstall {{args}} --package-lock-only --ignore-scripts

# ==============================================================================
# 🚀 開発 & ビルド (Development & Build)
# ==============================================================================

# 開発サーバーを起動 (http://localhost:5173)
[group('dev')]
dev:
    npm run dev

# 開発サーバーをLocalStorageモードで起動 (Firebase不要・UI作業向け)
[group('dev')]
dev-local:
    npm run dev:local

# プロダクションビルド
[group('dev')]
build:
    npm run build

# ==============================================================================
# 🧪 テスト (Testing)
# ==============================================================================

# テストを実行 (例: just test --reporter=verbose)
[group('test')]
test *args:
    vitest run {{args}}

# ステージング済みファイルのみテスト
[group('test')]
test-staged:
    npm run test:staged

# Firebase Emulatorでインテグレーションテストを実行
[group('test')]
test-emulator:
    npm run test:emulator

# テストをwatch modeで実行
[group('test')]
test-watch:
    npm run test:watch

# テストカバレッジレポートを生成
[group('test')]
coverage:
    npm run test:coverage

# E2Eテストを実行
[group('test')]
e2e:
    npm run e2e

# E2EテストをUIモードで実行
[group('test')]
e2e-ui:
    npm run e2e:ui

# ==============================================================================
# 🧹 コード品質 (Lint & Quality)
# ==============================================================================

# Biome lint/formatチェック
[group('lint')]
check:
    npm run check

# Biome lint/format自動修正
[group('lint')]
check-fix:
    npm run check:fix

# 型チェック
[group('lint')]
typecheck:
    npm run typecheck
