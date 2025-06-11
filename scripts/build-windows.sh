#!/bin/bash

# 跨平台编译脚本 - Windows 64位
# 在 macOS 上编译 Windows 应用

echo "🚀 开始编译 Windows 64位 版本..."

# 确保在项目根目录
cd "$(dirname "$0")/.."

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf dist/electron

# 设置环境变量
export TARGET_PLATFORM=win32
export TARGET_ARCH=x64
export ELECTRON_BUILDER_ARCH=x64

# 使用 quasar 编译
echo "📦 使用 Quasar 编译 Electron 应用 (AMD64 架构)..."
npm run build:electron:win-x64

# 检查编译结果
if [ $? -eq 0 ]; then
    echo "✅ Windows 64位版本编译完成！"
    echo "📁 输出目录: dist/electron/"
    
    # 显示输出文件
    echo "📄 编译文件列表:"
    ls -la dist/electron/
else
    echo "❌ 编译失败，请检查错误信息"
    exit 1
fi
