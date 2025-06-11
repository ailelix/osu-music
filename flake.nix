{
  description = "osu-music development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js 独立环境
            nodejs_22
            nodePackages.npm
            nodePackages.yarn
            nodePackages.pnpm
            
            # 开发工具
            git
            
            # iOS 开发工具（如果需要）
            # cocoapods
            
            # 可选：其他有用的工具
            jq  # JSON 处理
            tree  # 目录树显示
          ];

          shellHook = ''
            # 继承系统 zsh 配置
            if [ -f ~/.zshrc ]; then
              source ~/.zshrc
            fi
            
            # 设置 Node.js 独立环境
            export NODE_PATH="${pkgs.nodejs_22}/lib/node_modules"
            export NPM_CONFIG_PREFIX="$PWD/.npm-global"
            export PATH="$NPM_CONFIG_PREFIX/bin:$PATH"
            
            # 创建本地 npm 全局目录
            mkdir -p "$NPM_CONFIG_PREFIX"
            
            # 项目环境变量
            export NODE_ENV="development"
            
            # 欢迎信息
            echo "🎵 osu-music development environment"
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
            echo "npm global prefix: $NPM_CONFIG_PREFIX"
            echo ""
            echo "Available commands:"
            echo "  npm run dev    - Start development server"
            echo "  npm run build  - Build for production"
            echo "  npm run lint   - Run linter"
            echo "  npm run format - Format code"
            echo ""
          '';
        };
      });
}
