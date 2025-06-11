#!/usr/bin/env node
/**
 * Windows 专用调试启动脚本
 * 解决 Windows 下 Electron 调试的常见问题
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// 检测可用端口
async function findAvailablePort(startPort = 5858) {
  const net = require('net');

  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// 主函数
async function startDebugMode() {
  console.log('🔧 Windows Electron Debug Launcher');
  console.log('Platform:', os.platform(), os.arch());
  console.log('Node.js:', process.version);

  // 查找可用端口
  const debugPort = await findAvailablePort(5858);
  console.log('🔍 Using debug port:', debugPort);

  // 设置环境变量
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    ELECTRON_IS_DEV: '1',
    ELECTRON_ENABLE_LOGGING: '1',
    ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
    // 禁用 GPU 加速以避免 Windows 下的渲染问题
    ELECTRON_DISABLE_GPU: '1',
    // 设置调试端口
    ELECTRON_INSPECT_PORT: debugPort.toString(),
  };

  // 启动命令
  const quasarCmd = process.platform === 'win32' ? 'quasar.cmd' : 'quasar';
  const args = [
    'dev',
    '-m',
    'electron',
    '--', // 传递给 electron 的参数
    `--inspect=${debugPort}`,
    '--remote-debugging-port=0', // 自动选择远程调试端口
    '--disable-web-security',
    '--allow-running-insecure-content',
  ];

  console.log('🚀 Starting Quasar Electron with args:', args.join(' '));

  // 启动进程
  const child = spawn(quasarCmd, args, {
    env,
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  // 处理进程事件
  child.on('error', (error) => {
    console.error('❌ Failed to start process:', error.message);
    if (error.code === 'ENOENT') {
      console.error('💡 Tip: Make sure @quasar/cli is installed globally:');
      console.error('   npm install -g @quasar/cli');
    }
  });

  child.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`❌ Process exited with code ${code} and signal ${signal}`);
    } else {
      console.log('✅ Process exited normally');
    }
  });

  // 处理 Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    child.kill('SIGTERM');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    child.kill('SIGTERM');
  });
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 启动
startDebugMode().catch((error) => {
  console.error('❌ Failed to start debug mode:', error);
  process.exit(1);
});
