#!/usr/bin/env bash
# osu-music 开发环境设置脚本

echo "🎵 设置 osu-music 开发环境..."

# 检查是否安装了 Nix
if ! command -v nix &> /dev/null; then
    echo "❌ 未找到 Nix，请先安装 Nix"
    echo "安装命令: sh <(curl -L https://nixos.org/nix/install)"
    exit 1
fi

# 检查是否启用了 flakes
if ! nix flake --help &> /dev/null; then
    echo "❌ Nix flakes 未启用"
    echo "请在 ~/.config/nix/nix.conf 中添加："
    echo "experimental-features = nix-command flakes"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")"

# 检查是否有 flake.nix
if [ ! -f "flake.nix" ]; then
    echo "❌ 未找到 flake.nix 文件"
    exit 1
fi

echo "✅ 检查完成，启动开发环境..."

# 如果安装了 direnv，自动允许
if command -v direnv &> /dev/null && [ -f ".envrc" ]; then
    echo "📁 检测到 direnv，自动允许 .envrc"
    direnv allow
fi

# 进入 Nix 开发环境
echo "🚀 启动 Nix 开发环境..."
nix develop
