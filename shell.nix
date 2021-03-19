{ pkgs ? import <nixpkgs> {}
}:
pkgs.mkShell {
  name = "zer0-dev-shell";
  buildInputs = [
    # deps
    pkgs.nodejs-15_x
    pkgs.nodePackages.create-react-app
    pkgs.nodePackages.yarn
    # tools
    pkgs.toybox
    pkgs.git
    pkgs.nano
    pkgs.neovim
    pkgs.kakoune
    pkgs.tmux
    pkgs.jq
    pkgs.curl
  ];
  shellHook = ''
    echo "Entering dev environment"
  '';
}
