#!/bin/bash

# Build script for macOS Universal Binary (Alpha 0.1.0)
# This script builds OSU! Music for both Intel and Apple Silicon Macs

echo "🚀 Building OSU! Music Alpha 0.1.0 for macOS Universal..."

# Set environment variables
export NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/electron

# Build for all architectures (this will create separate builds for x64 and arm64)
echo "🔨 Building for all macOS architectures..."
ELECTRON_BUILDER_ARCH=all npm run build:electron:mac-universal

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📦 Builds created at: dist/electron/"
    
    # List the generated files
    echo "📋 Generated files:"
    ls -la dist/electron/
    
    # Show app bundle details
    echo "📱 App bundle details:"
    find dist/electron -name "*.app" -type d | while read app; do
        echo "  📦 $app"
        if [ -f "$app/Contents/MacOS/OSU! Music" ]; then
            echo "    🏗️  Architecture: $(file "$app/Contents/MacOS/OSU! Music")"
        fi
    done
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 OSU! Music Alpha 0.1.0 macOS build complete!"
