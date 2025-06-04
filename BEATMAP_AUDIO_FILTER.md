# Beatmap 下载音频过滤策略 - 仅保留 MP3 文件

## 修改概述

我们已经成功实现了只保留 MP3 音乐文件，排除 WAV 音效文件的策略。

## 具体修改

### 1. 服务层修改 (`src/services/beatmapDownloadService.ts`)

```typescript
// 修改前：支持多种音频格式
const audioExtensions = ['.mp3', '.wav', '.ogg'];

// 修改后：只支持 MP3
const audioExtensions = ['.mp3'];
```

**关键变化：**

- 解压时只提取 `.mp3` 文件
- 跳过 `.wav` 音效文件（如点击音效、击打音效等）
- 跳过 `.ogg` 和其他格式
- 更新相关日志信息以准确反映策略

### 2. Electron 主进程修改 (`src-electron/electron-main.ts`)

```typescript
// 新增专门用于 beatmap 下载的验证函数
function isValidBeatmapAudioFile(filename: string): boolean {
  const allowedExtensions = ['.mp3']; // 只允许MP3
  const extension = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(extension);
}
```

**关键变化：**

- 添加 `isValidBeatmapAudioFile` 函数专门用于 beatmap 下载验证
- 保留原有 `isValidAudioFile` 函数用于音乐库扫描（向后兼容）
- 更新保存音频文件的验证逻辑

### 3. UI 组件修改

#### BeatmapCard.vue

- 下载按钮增加工具提示："Download MP3 music files (sound effects excluded)"

#### ScoreListItem.vue

- 下载按钮工具提示更新："Download MP3 music files (sound effects excluded)"

### 4. 文档更新 (`MUSIC_STORAGE.md`)

添加了详细的音频格式支持说明：

```markdown
### Beatmap 下载

从 osu! beatmaps 下载音乐时，只保留 MP3 格式的音频文件：

- ✅ **MP3**: 主要音乐文件（保留）
- ❌ **WAV**: 音效文件（跳过，避免下载点击音效等）
- ❌ **OGG**: 其他格式（跳过）
```

## 策略优势

1. **节省存储空间**: 不下载不必要的音效文件
2. **提高下载效率**: 只下载真正的音乐文件
3. **用户体验**: 避免音乐库被音效文件干扰
4. **向后兼容**: 音乐库扫描仍支持所有格式

## 兼容性说明

- **音乐库扫描**: 仍然支持 MP3、WAV、OGG、FLAC、M4A 格式
- **Beatmap 下载**: 只保留 MP3 格式
- **现有文件**: 不影响已下载的文件

## 测试验证

使用测试脚本验证过滤逻辑：

- Beatmap 下载: 只保留 3 个 MP3 文件
- 音乐库扫描: 支持 10 个文件（包含所有格式）
- 跳过的 WAV 音效文件: 4 个（click.wav, hit.WAV, normal-hitwhistle.wav, normal-hitfinish.wav）

## 完成状态

✅ 所有修改已完成并通过以下验证：

- ESLint 代码检查通过
- TypeScript 类型检查通过
- 组件编译无错误
- 逻辑测试验证通过

此策略确保了用户只下载真正需要的音乐文件，同时保持了系统的向后兼容性。
