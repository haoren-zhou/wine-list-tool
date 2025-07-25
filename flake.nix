{
  description = "A Nix development shell for wine-list-tool";

  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1";

  outputs = inputs:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: inputs.nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import inputs.nixpkgs { inherit system; };
      });
      pythonVersion = "3.12";
    in
    {
      devShells = forEachSupportedSystem ({ pkgs }:
        let
          concatMajorMinor = v:
            pkgs.lib.pipe v [
              pkgs.lib.versions.splitVersion
              (pkgs.lib.sublist 0 2)
              pkgs.lib.concatStrings
            ];

          python = pkgs."python${concatMajorMinor pythonVersion}";
        in
        {
          default = pkgs.mkShell {
            name = "wine-list-tool-shell";
            packages = [
              python
              pkgs.uv
              pkgs.nodejs_22
            ];

            shellHook = ''
              echo "Entering wine-list-tool development shell"
            '';
          };
        });
    };
}
