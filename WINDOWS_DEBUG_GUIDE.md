# Windows 调试指南

## 概述

本文档解决 Windows 用户在运行 osu-music Electron 应用时遇到的常见调试问题。

## 常见错误及解决方案

### 1. DevTools 相关错误

**错误症状：**

```
Uncaught (in promise) SyntaxError: Unexpected token 'H', "HTTP/1.1 4"... is not valid JSON
Request Autofill.enable failed. {"code":-32601,"message":"'Autofill.enable' wasn't found"}
```

**解决方案：**
这些是 Chrome DevTools 的正常警告，不影响应用功能。已在新版本中通过以下方式优化：

- 使用分离式 DevTools 窗口
- 延迟开启 DevTools 避免初始化竞争
- 禁用不必要的自动填充功能

### 2. 调试端口冲突

**错误症状：**

```
Error: listen EADDRINUSE: address already in use :::5858
```

**解决方案：**
使用动态端口分配，自动避免端口冲突。

### 3. GPU 硬件加速问题

**错误症状：**

- 应用启动缓慢
- 界面渲染异常
- 偶发的崩溃

**解决方案：**
在开发模式下自动禁用 GPU 硬件加速。

## 启动方式

### 方法 1：使用批处理文件 (推荐)

```cmd
# 双击运行
debug-windows.bat
```

### 方法 2：使用 npm 脚本

```cmd
npm run dev:electron:win
```

### 方法 3：使用 Node.js 脚本

```cmd
node scripts/debug-windows.js
```

### 方法 4：传统方式

```cmd
quasar dev -m electron
```

## Windows 特定优化

### 已应用的优化：

1. **GPU 禁用**：避免硬件加速相关问题
2. **动态端口**：自动分配可用的调试端口
3. **分离式 DevTools**：减少 UI 冲突
4. **错误处理**：更好的异常捕获和日志
5. **安全警告禁用**：清理控制台输出

### 环境变量设置：

```cmd
set NODE_ENV=development
set ELECTRON_IS_DEV=1
set ELECTRON_ENABLE_LOGGING=1
set ELECTRON_DISABLE_SECURITY_WARNINGS=1
set ELECTRON_DISABLE_GPU=1
```

## 故障排除

### 问题：Quasar CLI 未找到

```cmd
# 全局安装 Quasar CLI
npm install -g @quasar/cli
```

### 问题：依赖安装失败

```cmd
# 清理并重新安装
rmdir /s node_modules
del package-lock.json
npm install
```

### 问题：Electron 版本冲突

```cmd
# 重新安装 Electron
npm uninstall electron
npm install electron --save-dev
```

### 问题：权限错误

```cmd
# 以管理员身份运行命令提示符
# 或使用 PowerShell (以管理员身份)
```

## 调试技巧

### 1. 查看详细日志

```cmd
# 启用详细日志
set DEBUG=*
npm run dev:electron:win
```

### 2. 检查端口使用情况

```cmd
# 查看端口占用
netstat -ano | findstr :5858
```

### 3. 强制终止进程

```cmd
# 终止 Electron 进程
taskkill /f /im electron.exe
```

### 4. 清理临时文件

```cmd
# 清理 Quasar 临时文件
rmdir /s .quasar
```

## 性能优化建议

1. **关闭不必要的程序**：释放系统资源
2. **使用 SSD**：提高文件读写速度
3. **增加内存**：建议至少 8GB RAM
4. **禁用实时杀毒扫描**：避免文件访问延迟
5. **使用有线网络**：确保稳定的网络连接

## 已知限制

1. **字体渲染**：Windows 下可能存在字体模糊问题
2. **路径长度**：Windows 路径长度限制可能影响某些操作
3. **文件名字符**：避免使用特殊字符在文件名中
4. **防火墙**：可能需要允许 Electron 通过防火墙

## 联系支持

如果问题仍然存在，请提供以下信息：

- Windows 版本 (例如: Windows 10/11)
- Node.js 版本 (`node --version`)
- npm 版本 (`npm --version`)
- 完整的错误日志
- 重现步骤

## 更新日志

### v1.2.0

- 添加 Windows 专用调试脚本
- 优化 GPU 硬件加速设置
- 改进错误处理和日志记录

### v1.1.0

- 修复 DevTools 初始化问题
- 添加动态端口分配
- 优化窗口创建流程

### v1.0.0

- 初始 Windows 支持
- 基础调试功能
