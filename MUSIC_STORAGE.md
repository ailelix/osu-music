# 音乐存储路径说明

## 统一存储位置

osu! Music 应用使用统一的存储路径：

```
~/Music/osu-music/
├── *.mp3, *.wav, *.ogg, *.flac    # 音乐文件
└── playlists/                      # 播放列表文件夹
    ├── my-favorites.json          # 我的收藏（默认播放列表）
    ├── *.json                     # 其他自定义播放列表
    └── ...
```

## 特性

1. **统一管理**: 所有音乐相关文件都存储在用户的 Music 目录下
2. **跨平台**: 自动适配不同操作系统的 Music 目录
3. **权限安全**: 使用用户目录，避免项目文件夹权限问题
4. **数据持久**: 音乐文件和播放列表在应用更新后依然保留

## 技术实现

- Electron 主进程通过 `app.getPath('music')` 获取系统 Music 目录
- IPC 通信确保渲染进程能安全访问文件系统
- 浏览器环境下提供降级处理

## 支持的音频格式

### 音乐库扫描

- MP3
- WAV
- OGG
- FLAC
- M4A

### Beatmap 下载

从 osu! beatmaps 下载音乐时，支持多种高质量音频格式：

- ✅ **MP3**: 主要音乐文件（保留）
- ✅ **OGG**: 高质量音频文件（保留）
- ✅ **FLAC**: 无损音频文件（保留）
- ❌ **WAV**: 音效文件（跳过，避免下载点击音效等）

这样可以确保只下载真正的音乐文件，避免下载游戏音效。

## 播放列表格式

播放列表使用 JSON 格式存储，包含以下字段：

```json
{
  "id": "unique-id",
  "name": "播放列表名称",
  "description": "描述",
  "isDefault": false,
  "createdAt": "2024-06-04T14:30:00.000Z",
  "updatedAt": "2024-06-04T14:30:00.000Z",
  "trackCount": 10,
  "totalDuration": 2400,
  "tags": ["tag1", "tag2"],
  "tracks": [
    {
      "beatmapsetId": 1234567,
      "title": "歌曲标题",
      "artist": "艺术家",
      "duration": 240,
      "bpm": 180,
      "addedAt": "2024-06-04T14:30:00.000Z"
    }
  ]
}
```
