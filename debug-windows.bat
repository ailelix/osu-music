@echo off
REM Windows Electron Debug Launcher
REM 解决 Windows 下常见的调试问题

echo 🔧 Windows Electron Debug Launcher
echo.

REM 检查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM 检查 npm
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ npm not found. Please install npm first.
    pause
    exit /b 1
)

REM 检查 Quasar CLI
where quasar >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 📦 Quasar CLI not found. Installing globally...
    npm install -g @quasar/cli
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to install Quasar CLI
        pause
        exit /b 1
    )
)

REM 检查项目依赖
if not exist "node_modules" (
    echo 📦 Installing project dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM 设置环境变量
set NODE_ENV=development
set ELECTRON_IS_DEV=1
set ELECTRON_ENABLE_LOGGING=1
set ELECTRON_DISABLE_SECURITY_WARNINGS=1
set ELECTRON_DISABLE_GPU=1

echo 🚀 Starting Electron app with optimized Windows settings...
echo.

REM 启动 Quasar Electron
node scripts/debug-windows.js

echo.
echo ✅ Debug session ended.
pause
