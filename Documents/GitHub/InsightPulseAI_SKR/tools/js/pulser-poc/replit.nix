{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [];
  };
}