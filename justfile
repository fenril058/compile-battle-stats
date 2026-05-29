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

# テストを実行 (例: just test --reporter=verbose)
test *args:
    npx vitest run {{args}}

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
