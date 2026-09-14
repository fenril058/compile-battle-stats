#!/usr/bin/env node
// `@playwright/test` と nixpkgs の `playwright-driver` が同じバージョンか検査する。
//
// E2E のブラウザは Nix devShell が `playwright-driver.browsers` で供給する（`flake.nix`）。
// Playwright は起動時、自分のバージョンに紐づく Chromium を revision 入りのディレクトリ名で
// 探す（例: 1.61.1 なら `chromium_headless_shell-1228`）。nixpkgs が同梱する revision は
// nixpkgs 側の playwright のバージョンで決まるため、npm 側だけが進むと参照先が存在せず、
// `browserType.launch: Executable doesn't exist at ...` で `just e2e` が起動しなくなる。
//
// `ci.yml` は E2E を実行しないため、このズレは CI では検出されずローカルで気づくまで
// 黙って壊れたままになる。この検査はその沈黙を埋める。
//
// バージョンが一致していれば revision も一致する。nixpkgs の playwright-driver は、同じ
// バージョンの playwright 配布物に入っている browsers.json から revision を取るため、
// バージョンだけを突き合わせれば足り、ブラウザを実体化する必要がない（`nix eval` は
// 評価だけで済み、ダウンロードを伴わない）。
//
// バージョン範囲（`^1.61.1` など）も落とす。範囲を許すと package.json を変えないまま
// lockfile の更新だけで実際のバージョンが動き、この検査を素通りするため。
//
// 使い方: node scripts/check-playwright-version.mjs

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifestPath = new URL("../package.json", import.meta.url);
const PACKAGE = "@playwright/test";
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

function fail(message) {
  console.error(`playwright のバージョン検査に失敗した: ${message}`);
  process.exit(1);
}

function npmVersion() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const spec = manifest.devDependencies?.[PACKAGE];
  if (!spec) fail(`package.json に ${PACKAGE} が無い`);
  if (!EXACT_VERSION.test(spec)) {
    fail(
      `${PACKAGE} が範囲指定になっている（${spec}）。nixpkgs と揃える必要があるので、正確なバージョンで固定する`,
    );
  }
  return spec;
}

function nixVersion() {
  const expr =
    `(builtins.getFlake "${root}")` +
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Nix式の中の補間であり、JSの補間ではない
    ".inputs.nixpkgs.legacyPackages.${builtins.currentSystem}.playwright-driver.version";
  try {
    return execFileSync("nix", ["eval", "--raw", "--impure", "--expr", expr], {
      encoding: "utf8",
    }).trim();
  } catch (error) {
    fail(`playwright-driver のバージョンを評価できなかった:\n${error.message}`);
  }
}

const npm = npmVersion();
const nix = nixVersion();
if (npm !== nix) {
  fail(
    `${PACKAGE}=${npm} と nixpkgs の playwright-driver=${nix} が食い違っている。\n` +
      `  npm 側が新しいなら: ${PACKAGE} を ${nix} へ戻す（nixpkgs がまだ追随していない）\n` +
      `  nixpkgs 側が新しいなら: nixpkgs が追いついた合図。${PACKAGE} を ${nix} へ上げる`,
  );
}
console.log(`playwright のバージョンは揃っている（${npm}）`);
