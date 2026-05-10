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
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            typescript-language-server
            biome
            npm-check-updates
            pkgs.nodejs
            importNpmLock.hooks.linkNodeModulesHook
          ];

          npmDeps = importNpmLock.buildNodeModules {
            npmRoot = ./.;
            inherit nodejs;
          };

          postShellHook = "";
        };
      }
    );
}
