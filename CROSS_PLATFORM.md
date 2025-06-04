# 跨平台兼容性配置

## 支持的操作系统

osu! Music 应用支持以下操作系统：

### Windows

- **支持版本**: Windows 10 及以上
- **音乐目录**: `%USERPROFILE%\Music\osu-music\`
- **播放列表目录**: `%USERPROFILE%\Music\osu-music\playlists\`
- **路径分隔符**: `\` (反斜杠)
- **特殊处理**:
  - 支持长文件名
  - 处理 Windows 文件名限制字符：`< > : " | ? * \`
  - 自动处理 UNC 路径

### macOS

- **支持版本**: macOS 10.14 及以上
- **音乐目录**: `~/Music/osu-music/`
- **播放列表目录**: `~/Music/osu-music/playlists/`
- **路径分隔符**: `/` (正斜杠)
- **特殊处理**:
  - 支持 Unicode 文件名
  - 处理 .DS_Store 文件自动忽略
  - 支持沙盒安全模型

### Linux

- **支持版本**: Ubuntu 18.04+, Fedora 30+, Arch Linux
- **音乐目录**: `~/Music/osu-music/` 或 `$XDG_MUSIC_DIR/osu-music/`
- **播放列表目录**: `~/Music/osu-music/playlists/`
- **路径分隔符**: `/` (正斜杠)
- **特殊处理**:
  - 遵循 XDG 基本目录规范
  - 支持符号链接
  - 处理权限管理

## 跨平台实现要点

### 1. 路径处理

```typescript
// ✅ 正确：使用 path.join() 和 app.getPath()
const musicPath = path.join(app.getPath('music'), 'osu-music');

// ❌ 错误：硬编码路径分隔符
const musicPath = os.homedir() + '/Music/osu-music';
```

### 2. 文件名处理

```typescript
// ✅ 正确：规范化文件名，移除不安全字符
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Windows 非法字符
    .replace(/[\u0000-\u001f]/g, '_') // 控制字符
    .trim()
    .substring(0, 255); // 限制长度
}
```

### 3. 目录创建

```typescript
// ✅ 正确：递归创建目录，处理权限
await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
```

### 4. 文件权限

```typescript
// ✅ 正确：设置合适的文件权限
await fs.writeFile(filePath, data, { mode: 0o644 });
```

## 测试覆盖

### Windows 测试要点

- [ ] 长路径支持 (>260 字符)
- [ ] 特殊字符文件名
- [ ] 不同磁盘驱动器
- [ ] 网络路径 (UNC)
- [ ] 管理员权限处理

### macOS 测试要点

- [ ] 中文/日文文件名
- [ ] 沙盒权限
- [ ] 外部存储设备
- [ ] 大小写敏感性
- [ ] .app 包权限

### Linux 测试要点

- [ ] 不同发行版兼容性
- [ ] SELinux/AppArmor 权限
- [ ] 符号链接处理
- [ ] 挂载点处理
- [ ] 用户权限变化

## 错误处理

### 常见错误及解决方案

#### ENOENT (文件不存在)

```typescript
try {
  await fs.access(filePath);
} catch (error) {
  if (error.code === 'ENOENT') {
    await ensureDirectoryExists(path.dirname(filePath));
  }
}
```

#### EACCES (权限拒绝)

```typescript
try {
  await fs.writeFile(filePath, data);
} catch (error) {
  if (error.code === 'EACCES') {
    // 尝试修改权限或使用备用位置
    console.warn('Permission denied, trying fallback location');
  }
}
```

#### EMFILE (文件句柄耗尽)

```typescript
// 使用连接池或限制并发文件操作
const semaphore = new Semaphore(10); // 限制同时打开10个文件
```

## 性能优化

### 文件系统性能

- 使用流式读写大文件
- 批量操作减少系统调用
- 缓存文件状态信息
- 异步操作避免阻塞

### 内存使用

- 及时释放文件句柄
- 使用分页加载大目录
- 限制并发文件操作数量

## 安全考虑

### 路径遍历防护

```typescript
function validatePath(userPath: string, baseDir: string): boolean {
  const resolvedPath = path.resolve(baseDir, userPath);
  return resolvedPath.startsWith(path.resolve(baseDir));
}
```

### 文件类型验证

```typescript
const allowedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];
const isValidAudioFile = allowedExtensions.includes(path.extname(filename).toLowerCase());
```

### 大小限制

```typescript
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_PLAYLIST_SIZE = 1024 * 1024; // 1MB
```
