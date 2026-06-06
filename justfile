default:
    @just --list

# npm audit
audit:
    npm audit

# npm install --package-lock-only
install package:
    npm install {{package}} --package-lock-only

# npm install -D --package-lock-only
install-dev package:
    npm install -D {{package}} --package-lock-only

# npm uninstall --package-lock-only
uninstall package:
    npm uninstall {{package}} --package-lock-only

# 開発サーバーを起動 (http://localhost:5173)
dev:
    npm run dev

# 開発サーバーをLocalStorageモードで起動 (Firebase不要・UI作業向け)
dev-local:
    npm run dev:local

# テストを実行 (例: just test --reporter=verbose)
test *args:
    vitest run {{args}}

# ステージング済みファイルのみテスト
test-staged:
    npm run test:staged

# Firebase Emulatorでインテグレーションテストを実行
test-emulator:
    npm run test:emulator

# テストをwatch modeで実行
test-watch:
    npm run test:watch

# テストカバレッジレポートを生成
coverage:
    npm run test:coverage

# Biome lint/formatチェック
check:
    npm run check

# Biome lint/format自動修正
check-fix:
    npm run check:fix

# 型チェック
typecheck:
    npm run typecheck

# プロダクションビルド
build:
    npm run build

# E2Eテストを実行
e2e:
    npm run e2e

# E2EテストをUIモードで実行
e2e-ui:
    npm run e2e:ui
