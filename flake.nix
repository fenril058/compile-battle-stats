{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        inherit (pkgs) importNpmLock;
        nodejs = pkgs.nodejs_24;
        npmDeps = importNpmLock.buildNodeModules {
          npmRoot = ./.;
          inherit nodejs;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            jdk
            firebase-tools
            just
            pinact
            zizmor
            ghalint
            typescript-language-server
            biome
            npm-check-updates
            nodejs
            importNpmLock.hooks.linkNodeModulesHook
          ];

          inherit npmDeps;

          postShellHook = ''
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
            export PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright"
          '';
        };

        devShells.ci = pkgs.mkShell {
          packages = with pkgs; [
            pinact
            zizmor
            ghalint
            biome
            nodejs
            importNpmLock.hooks.linkNodeModulesHook
          ];

          inherit npmDeps;
        };
      }
    );
}
