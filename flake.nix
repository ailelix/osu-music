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
        lib = pkgs.lib;
        stdenv = pkgs.stdenv;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js 独立环境
            nodejs_22
            nodePackages.npm
            nodePackages.pnpm
            
            # Quasar/Electron 开发需要的工具
            electron
            python3  # Electron 原生模块编译需要
            
            # macOS 开发工具 (如果在 macOS 上)
            ] ++ lib.optionals stdenv.isDarwin [
              darwin.apple_sdk.frameworks.CoreServices
              darwin.apple_sdk.frameworks.Foundation
              darwin.apple_sdk.frameworks.AppKit
            ] ++ [
            
            # Shell 环境
            zsh
            
            # 开发工具
            git
            
            # iOS 开发工具（如果需要 Capacitor iOS）
            # cocoapods
            
            # 可选：其他有用的工具
            jq  # JSON 处理
            tree  # 目录树显示
          ];

          shellHook = ''
            # 继承系统 zsh 配置，但优先使用 Nix 环境
            if [ -f ~/.zshrc ]; then
              export ORIG_ZSHRC=~/.zshrc
            fi
            
            # 设置 Node.js 独立环境
            export NODE_PATH="${pkgs.nodejs_22}/lib/node_modules"
            export NPM_CONFIG_PREFIX="$PWD/.npm-global"
            export PATH="$NPM_CONFIG_PREFIX/bin:$PATH"
            
            # 创建本地 npm 全局目录
            mkdir -p "$NPM_CONFIG_PREFIX"
            
            # Electron 环境变量
            export ELECTRON_IS_DEV=1
            export ELECTRON_ENABLE_LOGGING=1
            
            # 项目环境变量
            export NODE_ENV="development"
            
            # 欢迎信息
            echo "🎵 osu-music Quasar Electron 开发环境"
            echo "Node.js: $(node --version)"
            echo "npm: $(npm --version)"
            echo "Electron: $(electron --version)"
            echo "npm global prefix: $NPM_CONFIG_PREFIX"
            echo ""
            echo "可用命令:"
            echo "  quasar dev -m electron    - 启动 Electron 开发服务器"
            echo "  quasar build -m electron  - 构建 Electron 应用"
            echo "  quasar dev                - 启动 web 开发服务器"
            echo "  npm run lint              - 运行代码检查"
            echo "  npm run format            - 格式化代码"
            echo ""
            
            # 检查是否已安装 @quasar/cli
            if ! command -v quasar &> /dev/null; then
              echo "📦 检测到 @quasar/cli 未安装，正在全局安装..."
              npm install -g @quasar/cli
              echo "✅ @quasar/cli 安装完成"
              echo ""
            fi
            
            # 自动安装依赖（如果需要）
            if [ ! -d "node_modules" ]; then
              echo "📦 正在安装项目依赖..."
              pnpm install
              echo "✅ 项目依赖安装完成"
              echo ""
            fi
            
            # 设置 shell 环境（不要使用 exec，这会导致 direnv 循环）
            export SHELL=${pkgs.zsh}/bin/zsh
          '';
        };
      });
}
